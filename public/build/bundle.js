
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function getImage(src){
        let image = new Image();
        return new Promise((resolve,reject)=>{
            image.src = src;
            image.onload = () => resolve(image);
            image.onerror = error => reject(image);
        })
    }

    function getParam(key){
        let params;
        try{
            params = new URLSearchParams(window.location.search);
        } catch(e){
            console.error(e);
        }
        if(params.has(key)){
            return params.get(key);
        }
        return "";
    }

    function getDefaultText(){
        let superText = getParam("super");
        let mainText = getParam("main");
        let subText = getParam("sub");
        if(superText || mainText || subText){
            return {superText,mainText,subText}
        }
        return {
            superText : "",
            mainText : "HOLLOW KNIGHT ",
            subText : "Title generator"
        }
    }

    function rAF(loop){
        let frame;
        (function looper() {
            frame = requestAnimationFrame(looper);
            loop();
        })();
        return () => {
            cancelAnimationFrame(frame);
        };
    }

    class canvasHelper{
        constructor(canvas){
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
        }
        color = 'white';
        fontname = "perpetuabold";
        clear({x,y,w,h} = {}){
            this.ctx.clearRect(x || 0, y || 0,w || this.canvas.width,h || this.canvas.height);
        }
        withShadow(callback,{color,x,y,blur} = {}){
            this.ctx.save();
            this.ctx.shadowColor = color || this.color;
            this.ctx.shadowOffsetX = x || 0;
            this.ctx.shadowOffsetY = y || 0;
            this.ctx.shadowBlur = blur != undefined ? blur : 10;
            callback();
            this.ctx.restore();
        }
        addImage(image,{x,y,w,h} = {}){
            this.ctx.drawImage(image, x || 0, y || 0, w || image.width,h || image.height);
        }
        addText(txt,{font,color,size,ypos,blur} = {}){
            this.ctx.save();
            this.ctx.font = `${size}px ${font || this.fontname}`;
            this.ctx.fillStyle = color || this.color;
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = color || this.color;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            this.ctx.shadowBlur = blur != undefined ? blur : 10;
            let width = this.ctx.measureText(txt).width;
            for(width = this.ctx.measureText(txt).width; width > this.canvas.width; width = this.ctx.measureText(txt).width){
                size = size*0.90;
                this.ctx.font = `${size}px ${this.fontname}`;
            }
            this.ctx.fillText  (txt, this.canvas.width/2 - width/2, ypos-size/2 );
            this.ctx.restore();
        }
        download(filename){
            let image = this.canvas.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
            var link = document.createElement('a');
            link.download = filename || "download.png";
            link.href = image;
            link.click();
        }
    }

    class BannerParams{
        banner = undefined;
        constructor(name,bannerUrl,{needsShadow,color,blur,size,superText,mainText,subText} = {}){
            this.name = name;
            this.bannerUrl = bannerUrl;
            this.color = color;
            this.blur = blur || 10;
            this.needsShadow = !!needsShadow;
            this.size = size || {width: 1274, height: 521};
            this.superText = superText || { size : 32, ypos : 135};
            this.mainText = mainText || { size : 128, ypos : 215};
            this.subText = subText || { size : 32, ypos : 270};
        }

        use(){
            if(!this.loading && !this.banner){
                getImage(this.bannerUrl).then( i => { this.banner = i;  this.loading = false;});
                this.loading = true;
            }
        }

        isReady(){ return !!this.banner; }

    }

    /* src/App.svelte generated by Svelte v3.42.4 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (134:6) {#each allBanners as banner,index}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*banner*/ ctx[17].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*index*/ ctx[19];
    			option.value = option.__value;
    			add_location(option, file, 134, 7, 4211);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(134:6) {#each allBanners as banner,index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div10;
    	let div0;
    	let t2;
    	let div1;
    	let canvas;
    	let canvas_width_value;
    	let canvas_height_value;
    	let t3;
    	let div9;
    	let div8;
    	let div2;
    	let label0;
    	let t5;
    	let select;
    	let t6;
    	let div3;
    	let label1;
    	let input0;
    	let t7;
    	let t8;
    	let div4;
    	let label2;
    	let t10;
    	let input1;
    	let br0;
    	let t11;
    	let div5;
    	let label3;
    	let t13;
    	let input2;
    	let br1;
    	let t14;
    	let div6;
    	let label4;
    	let t16;
    	let input3;
    	let br2;
    	let t17;
    	let div7;
    	let button;
    	let t19;
    	let div13;
    	let div11;
    	let t21;
    	let div12;
    	let a0;
    	let t22;
    	let t23;
    	let footer;
    	let div15;
    	let div14;
    	let t24;
    	let a1;
    	let mounted;
    	let dispose;
    	let each_value = /*allBanners*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Hollow Knight Title Generator";
    			t1 = space();
    			div10 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			canvas = element("canvas");
    			t3 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title style";
    			t5 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div3 = element("div");
    			label1 = element("label");
    			input0 = element("input");
    			t7 = text("\n\t\t\t\t\t\tEnable blur");
    			t8 = space();
    			div4 = element("div");
    			label2 = element("label");
    			label2.textContent = "Superscript";
    			t10 = space();
    			input1 = element("input");
    			br0 = element("br");
    			t11 = space();
    			div5 = element("div");
    			label3 = element("label");
    			label3.textContent = "Main text";
    			t13 = space();
    			input2 = element("input");
    			br1 = element("br");
    			t14 = space();
    			div6 = element("div");
    			label4 = element("label");
    			label4.textContent = "Subscript";
    			t16 = space();
    			input3 = element("input");
    			br2 = element("br");
    			t17 = space();
    			div7 = element("div");
    			button = element("button");
    			button.textContent = "Download";
    			t19 = space();
    			div13 = element("div");
    			div11 = element("div");
    			div11.textContent = "Sharable url";
    			t21 = space();
    			div12 = element("div");
    			a0 = element("a");
    			t22 = text(/*link*/ ctx[0]);
    			t23 = space();
    			footer = element("footer");
    			div15 = element("div");
    			div14 = element("div");
    			t24 = text("Found a bug? Have any suggestions? Join us in the ");
    			a1 = element("a");
    			a1.textContent = "Hollow Knight Modding Discord Server";
    			attr_dev(h1, "class", "svelte-91a1jx");
    			add_location(h1, file, 121, 1, 3592);
    			attr_dev(div0, "class", "pure-u-1 pure-u-md-1-6");
    			add_location(div0, file, 123, 2, 3655);
    			attr_dev(canvas, "class", "mb-15 svelte-91a1jx");
    			attr_dev(canvas, "width", canvas_width_value = /*currentBanner*/ ctx[5].size?.width);
    			attr_dev(canvas, "height", canvas_height_value = /*currentBanner*/ ctx[5].size?.height);
    			add_location(canvas, file, 126, 3, 3743);
    			attr_dev(div1, "class", "pure-u-1 pure-u-md-2-3");
    			add_location(div1, file, 125, 2, 3703);
    			attr_dev(label0, "class", "pure-u-1 pad-v svelte-91a1jx");
    			add_location(label0, file, 131, 5, 3978);
    			attr_dev(select, "class", "pure-u-1");
    			if (/*selectedTitleIndex*/ ctx[4] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[9].call(select));
    			add_location(select, file, 132, 5, 4034);
    			attr_dev(div2, "class", "pure-g svelte-91a1jx");
    			add_location(div2, file, 130, 4, 3952);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file, 143, 6, 4381);
    			attr_dev(label1, "class", "pure-u-1 pad-v svelte-91a1jx");
    			add_location(label1, file, 142, 5, 4344);
    			attr_dev(div3, "class", "pure-g svelte-91a1jx");
    			add_location(div3, file, 141, 4, 4318);
    			attr_dev(label2, "class", "pure-u-1 pad-v svelte-91a1jx");
    			add_location(label2, file, 149, 5, 4503);
    			attr_dev(input1, "class", "pure-u-1");
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 150, 5, 4559);
    			add_location(br0, file, 150, 70, 4624);
    			attr_dev(div4, "class", "pure-g svelte-91a1jx");
    			add_location(div4, file, 148, 4, 4477);
    			attr_dev(label3, "class", "pure-u-1 pad-v svelte-91a1jx");
    			add_location(label3, file, 154, 5, 4671);
    			attr_dev(input2, "class", "pure-u-1");
    			attr_dev(input2, "type", "text");
    			add_location(input2, file, 155, 5, 4725);
    			add_location(br1, file, 155, 69, 4789);
    			attr_dev(div5, "class", "pure-g svelte-91a1jx");
    			add_location(div5, file, 153, 4, 4645);
    			attr_dev(label4, "class", "pure-u-1 pad-v svelte-91a1jx");
    			add_location(label4, file, 159, 5, 4836);
    			attr_dev(input3, "class", "pure-u-1");
    			attr_dev(input3, "type", "text");
    			add_location(input3, file, 160, 5, 4890);
    			add_location(br2, file, 160, 68, 4953);
    			attr_dev(div6, "class", "pure-g svelte-91a1jx");
    			add_location(div6, file, 158, 4, 4810);
    			attr_dev(button, "class", "pure-u-1");
    			add_location(button, file, 164, 5, 5012);
    			attr_dev(div7, "class", "pure-g pad-v-2 svelte-91a1jx");
    			add_location(div7, file, 163, 4, 4978);
    			attr_dev(div8, "class", "box mt-0 svelte-91a1jx");
    			add_location(div8, file, 129, 3, 3925);
    			attr_dev(div9, "class", "pure-u-1 pure-u-md-1-6");
    			add_location(div9, file, 128, 2, 3885);
    			attr_dev(div10, "class", "pure-g svelte-91a1jx");
    			add_location(div10, file, 122, 1, 3632);
    			attr_dev(div11, "class", "pure-u-1 pure-u-md-1-2 pad-v svelte-91a1jx");
    			add_location(div11, file, 170, 2, 5196);
    			attr_dev(a0, "class", "fit-text svelte-91a1jx");
    			attr_dev(a0, "href", /*link*/ ctx[0]);
    			add_location(a0, file, 174, 3, 5307);
    			attr_dev(div12, "class", "pure-u-1 pure-u-md-1-2");
    			add_location(div12, file, 173, 2, 5267);
    			attr_dev(div13, "class", "box svelte-91a1jx");
    			add_location(div13, file, 169, 1, 5176);
    			attr_dev(main, "class", "svelte-91a1jx");
    			add_location(main, file, 120, 0, 3584);
    			attr_dev(a1, "href", "https://discord.gg/rqsRHRt25h");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file, 181, 53, 5492);
    			attr_dev(div14, "class", "pure-u-1 mb-5");
    			add_location(div14, file, 180, 2, 5411);
    			attr_dev(div15, "class", "pure-g svelte-91a1jx");
    			add_location(div15, file, 179, 1, 5388);
    			attr_dev(footer, "class", "svelte-91a1jx");
    			add_location(footer, file, 178, 0, 5377);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div10);
    			append_dev(div10, div0);
    			append_dev(div10, t2);
    			append_dev(div10, div1);
    			append_dev(div1, canvas);
    			/*canvas_binding*/ ctx[8](canvas);
    			append_dev(div10, t3);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t5);
    			append_dev(div2, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedTitleIndex*/ ctx[4]);
    			append_dev(div8, t6);
    			append_dev(div8, div3);
    			append_dev(div3, label1);
    			append_dev(label1, input0);
    			input0.checked = /*enableBlur*/ ctx[3];
    			append_dev(label1, t7);
    			append_dev(div8, t8);
    			append_dev(div8, div4);
    			append_dev(div4, label2);
    			append_dev(div4, t10);
    			append_dev(div4, input1);
    			set_input_value(input1, /*text*/ ctx[1].superText);
    			append_dev(div4, br0);
    			append_dev(div8, t11);
    			append_dev(div8, div5);
    			append_dev(div5, label3);
    			append_dev(div5, t13);
    			append_dev(div5, input2);
    			set_input_value(input2, /*text*/ ctx[1].mainText);
    			append_dev(div5, br1);
    			append_dev(div8, t14);
    			append_dev(div8, div6);
    			append_dev(div6, label4);
    			append_dev(div6, t16);
    			append_dev(div6, input3);
    			set_input_value(input3, /*text*/ ctx[1].subText);
    			append_dev(div6, br2);
    			append_dev(div8, t17);
    			append_dev(div8, div7);
    			append_dev(div7, button);
    			append_dev(main, t19);
    			append_dev(main, div13);
    			append_dev(div13, div11);
    			append_dev(div13, t21);
    			append_dev(div13, div12);
    			append_dev(div12, a0);
    			append_dev(a0, t22);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div15);
    			append_dev(div15, div14);
    			append_dev(div14, t24);
    			append_dev(div14, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[9]),
    					listen_dev(select, "change", /*change_handler*/ ctx[10], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[13]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[14]),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*cH*/ ctx[6].download(`${/*text*/ ctx[1].superText}${/*text*/ ctx[1].mainText}${/*text*/ ctx[1].subText}.png`))) /*cH*/ ctx[6].download(`${/*text*/ ctx[1].superText}${/*text*/ ctx[1].mainText}${/*text*/ ctx[1].subText}.png`).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*currentBanner*/ 32 && canvas_width_value !== (canvas_width_value = /*currentBanner*/ ctx[5].size?.width)) {
    				attr_dev(canvas, "width", canvas_width_value);
    			}

    			if (dirty & /*currentBanner*/ 32 && canvas_height_value !== (canvas_height_value = /*currentBanner*/ ctx[5].size?.height)) {
    				attr_dev(canvas, "height", canvas_height_value);
    			}

    			if (dirty & /*allBanners*/ 128) {
    				each_value = /*allBanners*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedTitleIndex*/ 16) {
    				select_option(select, /*selectedTitleIndex*/ ctx[4]);
    			}

    			if (dirty & /*enableBlur*/ 8) {
    				input0.checked = /*enableBlur*/ ctx[3];
    			}

    			if (dirty & /*text*/ 2 && input1.value !== /*text*/ ctx[1].superText) {
    				set_input_value(input1, /*text*/ ctx[1].superText);
    			}

    			if (dirty & /*text*/ 2 && input2.value !== /*text*/ ctx[1].mainText) {
    				set_input_value(input2, /*text*/ ctx[1].mainText);
    			}

    			if (dirty & /*text*/ 2 && input3.value !== /*text*/ ctx[1].subText) {
    				set_input_value(input3, /*text*/ ctx[1].subText);
    			}

    			if (dirty & /*link*/ 1) set_data_dev(t22, /*link*/ ctx[0]);

    			if (dirty & /*link*/ 1) {
    				attr_dev(a0, "href", /*link*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*canvas_binding*/ ctx[8](null);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let link = "";
    	let text = getDefaultText();
    	let titleCanvas;
    	let enableBlur = getParam("title") == "true" || true;
    	let multiplier = 1.71;

    	let allBanners = [
    		new BannerParams("Base",
    		"Assets/banner.png",
    		{
    				size: { width: 1274, height: 521 },
    				superText: { size: 32, ypos: 135 },
    				mainText: { size: 128, ypos: 215 },
    				subText: { size: 32, ypos: 270 }
    			}),
    		new BannerParams("Hi-res",
    		"Assets/bannerhires.png",
    		{
    				needsShadow: true,
    				blur: 30,
    				size: { width: 3500, height: 1280 },
    				superText: { size: 32 * 2.4568, ypos: 135 * 2.4568 },
    				mainText: { size: 128 * 2.4568, ypos: 215 * 2.4568 },
    				subText: { size: 32 * 2.4568, ypos: 270 * 2.4568 }
    			}),
    		new BannerParams("Hi-res Black",
    		"Assets/hollow_knight_title_large_black.png",
    		{
    				color: "black",
    				needsShadow: true,
    				blur: 10,
    				size: { width: 3252, height: 1191 },
    				superText: { size: 32 * 2.25, ypos: 135 * 2.25 },
    				mainText: { size: 128 * 2.25, ypos: 215 * 2.25 },
    				subText: { size: 32 * 2.25, ypos: 270 * 2.25 }
    			}),
    		new BannerParams("VoidHeart",
    		"Assets/Logo_Voidheart.png",
    		{
    				needsShadow: true,
    				blur: 10,
    				size: { width: 2200, height: 663 },
    				superText: { size: 32 * 1.71, ypos: 135 * 1.71 },
    				mainText: { size: 128 * 1.71, ypos: 215 * 1.71 },
    				subText: { size: 32 * 1.71, ypos: 270 * 1.71 }
    			}),
    		new BannerParams("VoidHeart Black",
    		"Assets/Logo_Voidheart_Black.png",
    		{
    				color: "black",
    				needsShadow: true,
    				blur: 10,
    				size: { width: 2200, height: 663 },
    				superText: { size: 32 * 1.71, ypos: 135 * 1.71 },
    				mainText: { size: 128 * 1.71, ypos: 215 * 1.71 },
    				subText: { size: 32 * 1.71, ypos: 270 * 1.71 }
    			})
    	];

    	let selectedTitleIndex = 0;

    	try {
    		selectedTitleIndex = parseInt(getParam("title")) || 0;
    	} catch(e) {
    		
    	}

    	let currentBanner = allBanners[selectedTitleIndex];
    	let cH;

    	function updateLink() {
    		let templink = `${window.location.origin}${window.location.pathname}?title=${selectedTitleIndex}&blur=${enableBlur}&${text.superText && `super=${text.superText}&`}${text.mainText && `main=${text.mainText}&`}${text.subText && `sub=${text.subText}`}`;

    		if (link != templink) {
    			$$invalidate(0, link = templink);
    			window.history.pushState(link, "Title Change", link);
    		}
    	}

    	onMount(() => {
    		//const ctx = titleCanvas.getContext('2d');
    		$$invalidate(6, cH = new canvasHelper(titleCanvas));

    		return rAF(() => {
    			updateLink();

    			if (!currentBanner.isReady()) {
    				return currentBanner.use();
    			}

    			cH.clear();

    			if (currentBanner.needsShadow && enableBlur) {
    				cH.withShadow(
    					() => {
    						cH.addImage(currentBanner.banner);
    					},
    					{
    						blur: currentBanner.blur,
    						color: currentBanner.color
    					}
    				);
    			} else {
    				cH.addImage(currentBanner.banner);
    			}

    			cH.addText(text.superText.toUpperCase(), {
    				...currentBanner.superText,
    				blur: enableBlur ? currentBanner.blur : 0,
    				color: currentBanner.color
    			});

    			cH.addText(text.mainText.toUpperCase(), {
    				size: currentBanner.mainText.size + (!text.superText ? currentBanner.superText.size : 0) + (!text.subText ? currentBanner.subText.size : 0),
    				ypos: currentBanner.mainText.ypos - (!text.superText ? currentBanner.superText.size / 2 : 0) + (!text.subText ? currentBanner.subText.size / 2 : 0),
    				blur: enableBlur ? currentBanner.blur : 0,
    				color: currentBanner.color
    			});

    			cH.addText(text.subText.toUpperCase(), {
    				...currentBanner.subText,
    				blur: enableBlur ? currentBanner.blur : 0,
    				color: currentBanner.color
    			});
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			titleCanvas = $$value;
    			$$invalidate(2, titleCanvas);
    		});
    	}

    	function select_change_handler() {
    		selectedTitleIndex = select_value(this);
    		$$invalidate(4, selectedTitleIndex);
    	}

    	const change_handler = () => {
    		$$invalidate(5, currentBanner = allBanners[selectedTitleIndex]);
    	};

    	function input0_change_handler() {
    		enableBlur = this.checked;
    		$$invalidate(3, enableBlur);
    	}

    	function input1_input_handler() {
    		text.superText = this.value;
    		$$invalidate(1, text);
    	}

    	function input2_input_handler() {
    		text.mainText = this.value;
    		$$invalidate(1, text);
    	}

    	function input3_input_handler() {
    		text.subText = this.value;
    		$$invalidate(1, text);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		getParam,
    		getDefaultText,
    		rAF,
    		canvasHelper,
    		BannerParams,
    		link,
    		text,
    		titleCanvas,
    		enableBlur,
    		multiplier,
    		allBanners,
    		selectedTitleIndex,
    		currentBanner,
    		cH,
    		updateLink
    	});

    	$$self.$inject_state = $$props => {
    		if ('link' in $$props) $$invalidate(0, link = $$props.link);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    		if ('titleCanvas' in $$props) $$invalidate(2, titleCanvas = $$props.titleCanvas);
    		if ('enableBlur' in $$props) $$invalidate(3, enableBlur = $$props.enableBlur);
    		if ('multiplier' in $$props) multiplier = $$props.multiplier;
    		if ('allBanners' in $$props) $$invalidate(7, allBanners = $$props.allBanners);
    		if ('selectedTitleIndex' in $$props) $$invalidate(4, selectedTitleIndex = $$props.selectedTitleIndex);
    		if ('currentBanner' in $$props) $$invalidate(5, currentBanner = $$props.currentBanner);
    		if ('cH' in $$props) $$invalidate(6, cH = $$props.cH);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		link,
    		text,
    		titleCanvas,
    		enableBlur,
    		selectedTitleIndex,
    		currentBanner,
    		cH,
    		allBanners,
    		canvas_binding,
    		select_change_handler,
    		change_handler,
    		input0_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: ''
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
