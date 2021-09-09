export function getImage(src){
    let image = new Image();
    return new Promise((resolve,reject)=>{
        image.src = src;
        image.onload = () => resolve(image);
        image.onerror = error => reject(image);
    })
}

export function getParam(key){
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

export function getDefaultText(){
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

export function rAF(loop){
    let frame;
    (function looper() {
        frame = requestAnimationFrame(looper);
        loop();
    })();
    return () => {
        cancelAnimationFrame(frame);
    };
}

export class canvasHelper{
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

export class BannerParams{
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
            getImage(this.bannerUrl).then( i => this.banner = i).finally( () => this.loading = false);
            this.loading = true;
        }
    }

    isReady(){ return !!this.banner; }

}