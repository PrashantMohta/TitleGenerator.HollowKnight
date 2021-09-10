
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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

    function trySafe(fn){
        try{
            return fn();
        } catch(e) {
            console.error(e);
        }}

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
            return decodeURIComponent(params.get(key));
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
                this.ctx.font = `${size}px ${font || this.fontname}`;
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
        constructor(name,bannerUrl,{enableLight,needsShadow,color,blur,size,superText,mainText,subText} = {}){
            this.name = name;
            this.enableLight = enableLight;
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
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (193:6) {#each allBanners as banner,index}
    function create_each_block_1(ctx) {
    	let option;
    	let t0_value = /*banner*/ ctx[29].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*index*/ ctx[28];
    			option.value = option.__value;
    			add_location(option, file, 193, 7, 5998);
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(193:6) {#each allBanners as banner,index}",
    		ctx
    	});

    	return block;
    }

    // (204:6) {#each fontList as font,index}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*font*/ ctx[26].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*index*/ ctx[28];
    			option.value = option.__value;
    			add_location(option, file, 204, 7, 6274);
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
    		source: "(204:6) {#each fontList as font,index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div13;
    	let div0;
    	let t2;
    	let div2;
    	let canvas;
    	let canvas_width_value;
    	let canvas_height_value;
    	let t3;
    	let div1;
    	let label0;
    	let button0;
    	let t4;
    	let t5_value = (/*enableLight*/ ctx[3] ? "Dark" : "Light") + "";
    	let t5;
    	let t6;
    	let t7;
    	let div12;
    	let div11;
    	let div3;
    	let label1;
    	let t9;
    	let select0;
    	let t10;
    	let div4;
    	let label2;
    	let t12;
    	let select1;
    	let t13;
    	let div5;
    	let label3;
    	let input0;
    	let t14;
    	let t15;
    	let div6;
    	let label4;
    	let input1;
    	let t16;
    	let t17;
    	let div7;
    	let label5;
    	let t19;
    	let input2;
    	let br0;
    	let t20;
    	let div8;
    	let label6;
    	let t22;
    	let input3;
    	let br1;
    	let t23;
    	let div9;
    	let label7;
    	let t25;
    	let input4;
    	let br2;
    	let t26;
    	let div10;
    	let button1;
    	let t28;
    	let div16;
    	let div14;
    	let t30;
    	let div15;
    	let a0;
    	let t31;
    	let t32;
    	let footer;
    	let div18;
    	let div17;
    	let t33;
    	let a1;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*allBanners*/ ctx[11];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*fontList*/ ctx[10];
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
    			div13 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div2 = element("div");
    			canvas = element("canvas");
    			t3 = space();
    			div1 = element("div");
    			label0 = element("label");
    			button0 = element("button");
    			t4 = text("Use ");
    			t5 = text(t5_value);
    			t6 = text(" Background for preview");
    			t7 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Title style";
    			t9 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t10 = space();
    			div4 = element("div");
    			label2 = element("label");
    			label2.textContent = "Font";
    			t12 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			div5 = element("div");
    			label3 = element("label");
    			input0 = element("input");
    			t14 = text("\n\t\t\t\t\t\tEnable blur");
    			t15 = space();
    			div6 = element("div");
    			label4 = element("label");
    			input1 = element("input");
    			t16 = text("\n\t\t\t\t\t\tEnable bold");
    			t17 = space();
    			div7 = element("div");
    			label5 = element("label");
    			label5.textContent = "Superscript";
    			t19 = space();
    			input2 = element("input");
    			br0 = element("br");
    			t20 = space();
    			div8 = element("div");
    			label6 = element("label");
    			label6.textContent = "Main text";
    			t22 = space();
    			input3 = element("input");
    			br1 = element("br");
    			t23 = space();
    			div9 = element("div");
    			label7 = element("label");
    			label7.textContent = "Subscript";
    			t25 = space();
    			input4 = element("input");
    			br2 = element("br");
    			t26 = space();
    			div10 = element("div");
    			button1 = element("button");
    			button1.textContent = "Download";
    			t28 = space();
    			div16 = element("div");
    			div14 = element("div");
    			div14.textContent = "Sharable url";
    			t30 = space();
    			div15 = element("div");
    			a0 = element("a");
    			t31 = text(/*link*/ ctx[0]);
    			t32 = space();
    			footer = element("footer");
    			div18 = element("div");
    			div17 = element("div");
    			t33 = text("Found a bug? Have any suggestions? Join us in the ");
    			a1 = element("a");
    			a1.textContent = "Hollow Knight Modding Discord Server";
    			attr_dev(h1, "class", "svelte-p3t4wk");
    			add_location(h1, file, 168, 1, 5121);
    			attr_dev(div0, "class", "pure-u-1 pure-u-md-1-6");
    			add_location(div0, file, 170, 2, 5184);
    			attr_dev(canvas, "class", "mb-15 svelte-p3t4wk");
    			attr_dev(canvas, "width", canvas_width_value = /*currentBanner*/ ctx[8].size?.width);
    			attr_dev(canvas, "height", canvas_height_value = /*currentBanner*/ ctx[8].size?.height);
    			toggle_class(canvas, "light", /*enableLight*/ ctx[3]);
    			add_location(canvas, file, 174, 3, 5276);
    			add_location(button0, file, 183, 5, 5543);
    			attr_dev(label0, "class", "pure-u-1 pad-v-2 pointer button svelte-p3t4wk");
    			add_location(label0, file, 182, 4, 5490);
    			attr_dev(div1, "class", "pure-g svelte-p3t4wk");
    			add_location(div1, file, 181, 3, 5465);
    			attr_dev(div2, "class", "pure-u-1 pure-u-md-2-3");
    			add_location(div2, file, 173, 2, 5236);
    			attr_dev(label1, "class", "pure-u-1 pad-v svelte-p3t4wk");
    			add_location(label1, file, 190, 5, 5796);
    			attr_dev(select0, "class", "pure-u-1");
    			if (/*selectedTitleIndex*/ ctx[6] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[15].call(select0));
    			add_location(select0, file, 191, 5, 5852);
    			attr_dev(div3, "class", "pure-g svelte-p3t4wk");
    			add_location(div3, file, 189, 4, 5770);
    			attr_dev(label2, "class", "pure-u-1 pad-v svelte-p3t4wk");
    			add_location(label2, file, 201, 5, 6131);
    			attr_dev(select1, "class", "pure-u-1");
    			if (/*fontIndex*/ ctx[7] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[17].call(select1));
    			add_location(select1, file, 202, 5, 6180);
    			attr_dev(div4, "class", "pure-g svelte-p3t4wk");
    			add_location(div4, file, 200, 4, 6105);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file, 213, 6, 6442);
    			attr_dev(label3, "class", "pure-u-1 pad-v svelte-p3t4wk");
    			add_location(label3, file, 212, 5, 6405);
    			attr_dev(div5, "class", "pure-g svelte-p3t4wk");
    			add_location(div5, file, 211, 4, 6379);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file, 219, 6, 6600);
    			attr_dev(label4, "class", "pure-u-1 pad-v svelte-p3t4wk");
    			add_location(label4, file, 218, 5, 6563);
    			attr_dev(div6, "class", "pure-g svelte-p3t4wk");
    			add_location(div6, file, 217, 4, 6537);
    			attr_dev(label5, "class", "pure-u-1 pad-v svelte-p3t4wk");
    			add_location(label5, file, 225, 5, 6722);
    			attr_dev(input2, "class", "pure-u-1");
    			attr_dev(input2, "type", "text");
    			add_location(input2, file, 226, 5, 6778);
    			add_location(br0, file, 226, 70, 6843);
    			attr_dev(div7, "class", "pure-g svelte-p3t4wk");
    			add_location(div7, file, 224, 4, 6696);
    			attr_dev(label6, "class", "pure-u-1 pad-v svelte-p3t4wk");
    			add_location(label6, file, 230, 5, 6890);
    			attr_dev(input3, "class", "pure-u-1");
    			attr_dev(input3, "type", "text");
    			add_location(input3, file, 231, 5, 6944);
    			add_location(br1, file, 231, 69, 7008);
    			attr_dev(div8, "class", "pure-g svelte-p3t4wk");
    			add_location(div8, file, 229, 4, 6864);
    			attr_dev(label7, "class", "pure-u-1 pad-v svelte-p3t4wk");
    			add_location(label7, file, 235, 5, 7055);
    			attr_dev(input4, "class", "pure-u-1");
    			attr_dev(input4, "type", "text");
    			add_location(input4, file, 236, 5, 7109);
    			add_location(br2, file, 236, 68, 7172);
    			attr_dev(div9, "class", "pure-g svelte-p3t4wk");
    			add_location(div9, file, 234, 4, 7029);
    			attr_dev(button1, "class", "pure-u-1");
    			add_location(button1, file, 240, 5, 7231);
    			attr_dev(div10, "class", "pure-g pad-v-2 svelte-p3t4wk");
    			add_location(div10, file, 239, 4, 7197);
    			attr_dev(div11, "class", "box mt-0 svelte-p3t4wk");
    			add_location(div11, file, 188, 3, 5743);
    			attr_dev(div12, "class", "pure-u-1 pure-u-md-1-6");
    			add_location(div12, file, 187, 2, 5703);
    			attr_dev(div13, "class", "pure-g svelte-p3t4wk");
    			add_location(div13, file, 169, 1, 5161);
    			attr_dev(div14, "class", "pure-u-1 pure-u-md-1-2 pad-v svelte-p3t4wk");
    			add_location(div14, file, 246, 2, 7415);
    			attr_dev(a0, "class", "fit-text svelte-p3t4wk");
    			attr_dev(a0, "href", /*link*/ ctx[0]);
    			add_location(a0, file, 250, 3, 7526);
    			attr_dev(div15, "class", "pure-u-1 pure-u-md-1-2");
    			add_location(div15, file, 249, 2, 7486);
    			attr_dev(div16, "class", "box svelte-p3t4wk");
    			add_location(div16, file, 245, 1, 7395);
    			attr_dev(main, "class", "svelte-p3t4wk");
    			add_location(main, file, 167, 0, 5113);
    			attr_dev(a1, "href", "https://discord.gg/rqsRHRt25h");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file, 257, 53, 7711);
    			attr_dev(div17, "class", "pure-u-1 mb-5");
    			add_location(div17, file, 256, 2, 7630);
    			attr_dev(div18, "class", "pure-g svelte-p3t4wk");
    			add_location(div18, file, 255, 1, 7607);
    			attr_dev(footer, "class", "svelte-p3t4wk");
    			add_location(footer, file, 254, 0, 7596);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div13);
    			append_dev(div13, div0);
    			append_dev(div13, t2);
    			append_dev(div13, div2);
    			append_dev(div2, canvas);
    			/*canvas_binding*/ ctx[13](canvas);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, label0);
    			append_dev(label0, button0);
    			append_dev(button0, t4);
    			append_dev(button0, t5);
    			append_dev(button0, t6);
    			append_dev(div13, t7);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t9);
    			append_dev(div3, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*selectedTitleIndex*/ ctx[6]);
    			append_dev(div11, t10);
    			append_dev(div11, div4);
    			append_dev(div4, label2);
    			append_dev(div4, t12);
    			append_dev(div4, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*fontIndex*/ ctx[7]);
    			append_dev(div11, t13);
    			append_dev(div11, div5);
    			append_dev(div5, label3);
    			append_dev(label3, input0);
    			input0.checked = /*enableBlur*/ ctx[4];
    			append_dev(label3, t14);
    			append_dev(div11, t15);
    			append_dev(div11, div6);
    			append_dev(div6, label4);
    			append_dev(label4, input1);
    			input1.checked = /*enableBold*/ ctx[5];
    			append_dev(label4, t16);
    			append_dev(div11, t17);
    			append_dev(div11, div7);
    			append_dev(div7, label5);
    			append_dev(div7, t19);
    			append_dev(div7, input2);
    			set_input_value(input2, /*text*/ ctx[1].superText);
    			append_dev(div7, br0);
    			append_dev(div11, t20);
    			append_dev(div11, div8);
    			append_dev(div8, label6);
    			append_dev(div8, t22);
    			append_dev(div8, input3);
    			set_input_value(input3, /*text*/ ctx[1].mainText);
    			append_dev(div8, br1);
    			append_dev(div11, t23);
    			append_dev(div11, div9);
    			append_dev(div9, label7);
    			append_dev(div9, t25);
    			append_dev(div9, input4);
    			set_input_value(input4, /*text*/ ctx[1].subText);
    			append_dev(div9, br2);
    			append_dev(div11, t26);
    			append_dev(div11, div10);
    			append_dev(div10, button1);
    			append_dev(main, t28);
    			append_dev(main, div16);
    			append_dev(div16, div14);
    			append_dev(div16, t30);
    			append_dev(div16, div15);
    			append_dev(div15, a0);
    			append_dev(a0, t31);
    			insert_dev(target, t32, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div18);
    			append_dev(div18, div17);
    			append_dev(div17, t33);
    			append_dev(div17, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[15]),
    					listen_dev(select0, "change", /*change_handler*/ ctx[16], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[17]),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[18]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[19]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[20]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[21]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[22]),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*cH*/ ctx[9].download(`${/*text*/ ctx[1].superText}${/*text*/ ctx[1].mainText}${/*text*/ ctx[1].subText}.png`))) /*cH*/ ctx[9].download(`${/*text*/ ctx[1].superText}${/*text*/ ctx[1].mainText}${/*text*/ ctx[1].subText}.png`).apply(this, arguments);
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

    			if (dirty & /*currentBanner*/ 256 && canvas_width_value !== (canvas_width_value = /*currentBanner*/ ctx[8].size?.width)) {
    				attr_dev(canvas, "width", canvas_width_value);
    			}

    			if (dirty & /*currentBanner*/ 256 && canvas_height_value !== (canvas_height_value = /*currentBanner*/ ctx[8].size?.height)) {
    				attr_dev(canvas, "height", canvas_height_value);
    			}

    			if (dirty & /*enableLight*/ 8) {
    				toggle_class(canvas, "light", /*enableLight*/ ctx[3]);
    			}

    			if (dirty & /*enableLight*/ 8 && t5_value !== (t5_value = (/*enableLight*/ ctx[3] ? "Dark" : "Light") + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*allBanners*/ 2048) {
    				each_value_1 = /*allBanners*/ ctx[11];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*selectedTitleIndex*/ 64) {
    				select_option(select0, /*selectedTitleIndex*/ ctx[6]);
    			}

    			if (dirty & /*fontList*/ 1024) {
    				each_value = /*fontList*/ ctx[10];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*fontIndex*/ 128) {
    				select_option(select1, /*fontIndex*/ ctx[7]);
    			}

    			if (dirty & /*enableBlur*/ 16) {
    				input0.checked = /*enableBlur*/ ctx[4];
    			}

    			if (dirty & /*enableBold*/ 32) {
    				input1.checked = /*enableBold*/ ctx[5];
    			}

    			if (dirty & /*text*/ 2 && input2.value !== /*text*/ ctx[1].superText) {
    				set_input_value(input2, /*text*/ ctx[1].superText);
    			}

    			if (dirty & /*text*/ 2 && input3.value !== /*text*/ ctx[1].mainText) {
    				set_input_value(input3, /*text*/ ctx[1].mainText);
    			}

    			if (dirty & /*text*/ 2 && input4.value !== /*text*/ ctx[1].subText) {
    				set_input_value(input4, /*text*/ ctx[1].subText);
    			}

    			if (dirty & /*link*/ 1) set_data_dev(t31, /*link*/ ctx[0]);

    			if (dirty & /*link*/ 1) {
    				attr_dev(a0, "href", /*link*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*canvas_binding*/ ctx[13](null);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t32);
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
    	let enableLight = false;
    	let enableBlur = getParam("title") == "true" || true;
    	let enableBold = getParam("bold") == "true" || true;

    	let fontList = [
    		{
    			name: "Perpetua",
    			regular: "perpetua",
    			bold: "perpetuabold"
    		},
    		{
    			name: "Trajan Pro",
    			regular: "trajanPro",
    			bold: "trajanProBold"
    		}
    	];

    	let selectedTitleIndex = 0;
    	trySafe(() => $$invalidate(6, selectedTitleIndex = parseInt(getParam("title")) || 0));
    	let fontIndex = 1;
    	trySafe(() => $$invalidate(7, fontIndex = parseInt(getParam("font")) || 1));
    	let multiplier = 1.75;

    	let allBanners = [
    		new BannerParams("Base",
    		"Assets/banner.png",
    		{
    				enableLight: false,
    				size: { width: 1274, height: 521 },
    				superText: { size: 32, ypos: 135 },
    				mainText: { size: 128, ypos: 215 },
    				subText: { size: 32, ypos: 270 }
    			}),
    		new BannerParams("Hi-res",
    		"Assets/bannerhires.png",
    		{
    				enableLight: false,
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
    				enableLight: true,
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
    				enableLight: false,
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
    				enableLight: true,
    				needsShadow: true,
    				blur: 10,
    				size: { width: 2200, height: 663 },
    				superText: { size: 32 * 1.71, ypos: 135 * 1.71 },
    				mainText: { size: 128 * 1.71, ypos: 215 * 1.71 },
    				subText: { size: 32 * 1.71, ypos: 270 * 1.71 }
    			}),
    		new BannerParams("Silksong White",
    		"Assets/silksong_logo_white.png",
    		{
    				enableLight: false,
    				needsShadow: true,
    				blur: 10,
    				size: { width: 1606, height: 561 },
    				superText: { size: 32 * 1.75, ypos: (135 - 30) * 1.75 },
    				mainText: {
    					size: 128 * 1.75,
    					ypos: (215 - 30) * 1.75
    				},
    				subText: { size: 32 * 1.75, ypos: (270 - 30) * 1.75 }
    			}),
    		new BannerParams("Silksong Black",
    		"Assets/silksong_logo_black.png",
    		{
    				color: "black",
    				enableLight: true,
    				needsShadow: true,
    				blur: 10,
    				size: { width: 1606, height: 561 },
    				superText: { size: 32 * 1.75, ypos: (135 - 30) * 1.75 },
    				mainText: {
    					size: 128 * 1.75,
    					ypos: (215 - 30) * 1.75
    				},
    				subText: { size: 32 * 1.75, ypos: (270 - 30) * 1.75 }
    			})
    	];

    	let currentBanner;
    	setCurrentBanner();
    	let cH;

    	function updateLink() {
    		let templink = `${window.location.origin}${window.location.pathname}?title=${selectedTitleIndex}&blur=${enableBlur}&font=${fontIndex}&bold=${enableBold}&${text.superText && `super=${encodeURIComponent(text.superText)}&`}${text.mainText && `main=${encodeURIComponent(text.mainText)}&`}${text.subText && `sub=${encodeURIComponent(text.subText)}`}`;

    		if (link != templink) {
    			$$invalidate(0, link = templink);
    			window.history.pushState(link, "Title Change", link);
    		}
    	}

    	function setCurrentBanner() {
    		$$invalidate(8, currentBanner = allBanners[selectedTitleIndex]);
    		$$invalidate(3, enableLight = !!currentBanner.enableLight);
    	}

    	function getFont() {
    		return enableBold
    		? fontList[fontIndex].bold
    		: fontList[fontIndex].regular;
    	}

    	onMount(() => {
    		//const ctx = titleCanvas.getContext('2d');
    		$$invalidate(9, cH = new canvasHelper(titleCanvas));

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
    				font: getFont(),
    				blur: enableBlur ? currentBanner.blur : 0,
    				color: currentBanner.color
    			});

    			cH.addText(text.mainText.toUpperCase(), {
    				size: currentBanner.mainText.size + (!text.superText ? currentBanner.superText.size : 0) + (!text.subText ? currentBanner.subText.size : 0),
    				ypos: currentBanner.mainText.ypos - (!text.superText ? currentBanner.superText.size / 2 : 0) + (!text.subText ? currentBanner.subText.size / 2 : 0),
    				font: getFont(),
    				blur: enableBlur ? currentBanner.blur : 0,
    				color: currentBanner.color
    			});

    			cH.addText(text.subText.toUpperCase(), {
    				...currentBanner.subText,
    				font: getFont(),
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

    	const click_handler = () => $$invalidate(3, enableLight = !enableLight);

    	function select0_change_handler() {
    		selectedTitleIndex = select_value(this);
    		$$invalidate(6, selectedTitleIndex);
    	}

    	const change_handler = () => setCurrentBanner();

    	function select1_change_handler() {
    		fontIndex = select_value(this);
    		$$invalidate(7, fontIndex);
    	}

    	function input0_change_handler() {
    		enableBlur = this.checked;
    		$$invalidate(4, enableBlur);
    	}

    	function input1_change_handler() {
    		enableBold = this.checked;
    		$$invalidate(5, enableBold);
    	}

    	function input2_input_handler() {
    		text.superText = this.value;
    		$$invalidate(1, text);
    	}

    	function input3_input_handler() {
    		text.mainText = this.value;
    		$$invalidate(1, text);
    	}

    	function input4_input_handler() {
    		text.subText = this.value;
    		$$invalidate(1, text);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		trySafe,
    		getParam,
    		getDefaultText,
    		rAF,
    		canvasHelper,
    		BannerParams,
    		link,
    		text,
    		titleCanvas,
    		enableLight,
    		enableBlur,
    		enableBold,
    		fontList,
    		selectedTitleIndex,
    		fontIndex,
    		multiplier,
    		allBanners,
    		currentBanner,
    		cH,
    		updateLink,
    		setCurrentBanner,
    		getFont
    	});

    	$$self.$inject_state = $$props => {
    		if ('link' in $$props) $$invalidate(0, link = $$props.link);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    		if ('titleCanvas' in $$props) $$invalidate(2, titleCanvas = $$props.titleCanvas);
    		if ('enableLight' in $$props) $$invalidate(3, enableLight = $$props.enableLight);
    		if ('enableBlur' in $$props) $$invalidate(4, enableBlur = $$props.enableBlur);
    		if ('enableBold' in $$props) $$invalidate(5, enableBold = $$props.enableBold);
    		if ('fontList' in $$props) $$invalidate(10, fontList = $$props.fontList);
    		if ('selectedTitleIndex' in $$props) $$invalidate(6, selectedTitleIndex = $$props.selectedTitleIndex);
    		if ('fontIndex' in $$props) $$invalidate(7, fontIndex = $$props.fontIndex);
    		if ('multiplier' in $$props) multiplier = $$props.multiplier;
    		if ('allBanners' in $$props) $$invalidate(11, allBanners = $$props.allBanners);
    		if ('currentBanner' in $$props) $$invalidate(8, currentBanner = $$props.currentBanner);
    		if ('cH' in $$props) $$invalidate(9, cH = $$props.cH);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		link,
    		text,
    		titleCanvas,
    		enableLight,
    		enableBlur,
    		enableBold,
    		selectedTitleIndex,
    		fontIndex,
    		currentBanner,
    		cH,
    		fontList,
    		allBanners,
    		setCurrentBanner,
    		canvas_binding,
    		click_handler,
    		select0_change_handler,
    		change_handler,
    		select1_change_handler,
    		input0_change_handler,
    		input1_change_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
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
