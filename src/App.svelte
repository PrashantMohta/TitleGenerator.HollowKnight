<script>
	import { onMount } from 'svelte';
	import { trySafe, getParam, getDefaultText , rAF ,canvasHelper , BannerParams} from './utils';

	let link = "";
	let text = getDefaultText();
	let titleCanvas;
	let enableLight = false;
	let enableBlur = getParam("title") == "true" || true;
	let enableBold = getParam("bold") == "true" || true;
	let fontList = [
		{ name:"Perpetua", regular: "perpetua", bold : "perpetuabold" },
		{ name:"Trajan Pro", regular: "trajanPro", bold : "trajanProBold" }
	]

	let selectedTitleIndex = 0;
	trySafe( () => selectedTitleIndex = parseInt(getParam("title")) || 0);
	let fontIndex = 1;
	trySafe( () => fontIndex = parseInt(getParam("font")) || 1);

	let multiplier = 1.75;
	let allBanners = [
		new BannerParams(
			"Base",
			"Assets/banner.png",{
			enableLight : false,
			size : {width: 1274, height: 521},
			superText:{ size : 32, ypos : 135},
			mainText:{ size : 128, ypos : 215},
			subText:{ size : 32, ypos : 270}
		}),
		new BannerParams(
			"Hi-res",
			"Assets/bannerhires.png",{
			enableLight : false,
			needsShadow : true,
			blur : 30,	
			size : {width: 3500, height: 1280},
			superText:{ size : 32*2.4568, ypos : 135*2.4568},
			mainText:{ size : 128*2.4568, ypos : 215*2.4568},
			subText:{ size : 32*2.4568, ypos : 270*2.4568}
		}),
		new BannerParams(
			"Hi-res Black",
			"Assets/hollow_knight_title_large_black.png",{
			color:"black",
			enableLight : true,
			needsShadow : true,
			blur : 10,	
			size : {width: 3252, height: 1191},
			superText:{ size : 32*2.25, ypos : 135*2.25},
			mainText:{ size : 128*2.25, ypos : 215*2.25},
			subText:{ size : 32*2.25, ypos : 270*2.25}
		}),
		new BannerParams(
			"VoidHeart",
			"Assets/Logo_Voidheart.png",{
			enableLight : false,
			needsShadow : true,
			blur : 10,	
			size : {width: 2200, height: 663},
			superText:{ size : 32*1.71, ypos : 135*1.71},
			mainText:{ size : 128*1.71, ypos : 215*1.71},
			subText:{ size : 32*1.71, ypos : 270*1.71}
		}),
		new BannerParams(
			"VoidHeart Black",
			"Assets/Logo_Voidheart_Black.png",{
			color:"black",
			enableLight : true,
			needsShadow : true,
			blur : 10,	
			size : {width: 2200, height: 663},
			superText:{ size : 32*1.71, ypos : 135*1.71},
			mainText:{ size : 128*1.71, ypos : 215*1.71},
			subText:{ size : 32*1.71, ypos : 270*1.71}
		}),
		new BannerParams(
			"Silksong White",
			"Assets/silksong_logo_white.png",{
			enableLight : false,
			needsShadow : true,
			blur : 10,	
			size : {width: 1606, height: 561},
			superText:{ size : 32*1.75, ypos : (135-30)*1.75},
			mainText:{ size : 128*1.75, ypos : (215-30)*1.75},
			subText:{ size : 32*1.75, ypos : (270-30)*1.75}
		}),
		new BannerParams(
			"Silksong Black",
			"Assets/silksong_logo_black.png",{
			color:"black",
			enableLight : true,
			needsShadow : true,
			blur : 10,	
			size : {width: 1606, height: 561},
			superText:{ size : 32*1.75, ypos : (135-30)*1.75},
			mainText:{ size : 128*1.75, ypos : (215-30)*1.75},
			subText:{ size : 32*1.75, ypos : (270-30)*1.75}
		})
	]

	let currentBanner;
	setCurrentBanner();
	let cH;
	function updateLink(){
		let templink = `${window.location.origin}${window.location.pathname}?title=${selectedTitleIndex}&blur=${enableBlur}&font=${fontIndex}&bold=${enableBold}&${text.superText && `super=${encodeURIComponent(text.superText)}&`}${text.mainText && `main=${encodeURIComponent(text.mainText)}&`}${text.subText && `sub=${encodeURIComponent(text.subText)}`}`;
		if(link != templink){
			link = templink;
			window.history.pushState(link,"Title Change",link);
		}
	}
	function setCurrentBanner(){
		currentBanner = allBanners[selectedTitleIndex];
		enableLight = !!currentBanner.enableLight;
	}
	function getFont(){
		return enableBold ? fontList[fontIndex].bold : fontList[fontIndex].regular;
	}
	onMount(() => {
		//const ctx = titleCanvas.getContext('2d');
		cH = new canvasHelper(titleCanvas);
		return rAF(()=>{
			updateLink();
			if(!currentBanner.isReady()) {
				return currentBanner.use();
			}
			cH.clear();
			if(currentBanner.needsShadow && enableBlur){
				cH.withShadow(()=>{
					cH.addImage(currentBanner.banner);
				},{
					blur:currentBanner.blur,
					color:currentBanner.color
				});
			} else {
				cH.addImage(currentBanner.banner);
			}
			cH.addText(text.superText.toUpperCase(),
				{
					...currentBanner.superText,
					font: getFont(),
					blur: enableBlur ? currentBanner.blur : 0,
					color:currentBanner.color
				}
			);
			cH.addText(text.mainText.toUpperCase(),
				{	
					size:currentBanner.mainText.size + (!text.superText? currentBanner.superText.size : 0) + (!text.subText? currentBanner.subText.size : 0),
					ypos:currentBanner.mainText.ypos - (!text.superText? currentBanner.superText.size/2 : 0) + (!text.subText? currentBanner.subText.size/2 : 0),
					font: getFont(),
					blur: enableBlur ? currentBanner.blur : 0,
					color:currentBanner.color
				}
			);
			cH.addText(text.subText.toUpperCase(),
				{
					...currentBanner.subText,
					font: getFont(),
					blur: enableBlur ? currentBanner.blur : 0,
					color:currentBanner.color
				}
			);
		});
	});
</script>

<main>
	<h1>Hollow Knight Title Generator</h1>
	<div class="pure-g">
		<div class="pure-u-1 pure-u-md-1-6">
			
		</div>
		<div class="pure-u-1 pure-u-md-2-3">
			<canvas 
				class:light="{enableLight}"
				class="mb-15" 
				bind:this={titleCanvas} 
				width="{currentBanner.size?.width}" 
				height="{currentBanner.size?.height}">
			</canvas>
			<div class="pure-g">
				<label class="pure-u-1 pad-v-2 pointer button">
					<button on:click="{() => enableLight = !enableLight}"> Use {enableLight ? "Dark" : "Light"} Background for preview </button>
				</label>
			</div>
		</div>	
		<div class="pure-u-1 pure-u-md-1-6">
			<div class="box mt-0">
				<div class="pure-g">
					<label class="pure-u-1 pad-v">Title style</label> 
					<select class="pure-u-1"  bind:value={selectedTitleIndex} on:change="{() => setCurrentBanner()}">
						{#each allBanners as banner,index}
							<option value={index}>
								{banner.name}
							</option>
						{/each}
					</select>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">Font</label> 
					<select class="pure-u-1"  bind:value={fontIndex}>
						{#each fontList as font,index}
							<option value={index}>
								{font.name}
							</option>
						{/each}
					</select>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">
						<input type=checkbox bind:checked={enableBlur}>
						Enable blur
					</label>
				</div>
				<div class="pure-g">
					<label class="pure-u-1 pad-v">
						<input type=checkbox bind:checked={enableBold}>
						Enable bold
					</label>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">Superscript</label> 
					<input class="pure-u-1" bind:value={text.superText} type="text" ><br>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">Main text</label> 
					<input class="pure-u-1" bind:value={text.mainText} type="text" ><br>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">Subscript</label> 
					<input class="pure-u-1" bind:value={text.subText} type="text" ><br>
				</div>
				
				<div class="pure-g pad-v-2">
					<button class="pure-u-1" on:click={cH.download(`${text.superText}${text.mainText}${text.subText}.png`)}> Download </button>
				</div>
			</div>
		</div>	
	</div>
	<div class="box">
		<div class="pure-u-1 pure-u-md-1-2 pad-v">
			Sharable url 
		</div>
		<div class="pure-u-1 pure-u-md-1-2">
			<a class="fit-text" href="{link}">{link}</a>
		</div>
	</div>
</main>
<footer >
	<div class="pure-g">
		<div class="pure-u-1 mb-5">
			Found a bug? Have any suggestions? Join us in the <a href="https://discord.gg/rqsRHRt25h" target="_blank">Hollow Knight Modding Discord Server</a> 
		</div>
	</div>
</footer>
<style>
	.box{
		box-shadow: 0 0 0px 5px #103460;
		padding: 15px;
		margin: 15px;
		border-radius: 5px;
	}
	canvas {
		background:#16213E;
		border-radius: 5px;
		box-shadow: 0 0 0px 5px #103460;
		background: linear-gradient(130deg,  #1a1a2e, #103460, #ffffff);
		xanimation: 5s backgroundAnimation reverse infinite;
		background-size: 500% 500%;
		width: 100%;
		transition: 3s;
		background-position:10% 0%;
	}
	canvas.light{
		background-position:91% 100%
	}
	.fit-text{
		max-width: 80%;
		display: block;
		word-break: break-all;
		margin: auto;
	}
	.pure-g{
		padding-left : 15px;
		padding-right: 15px;

	}
	.pad-v{
		padding-top	   :5px;
		padding-bottom :5px;
	}

	.pad-v-2{
		padding-top	   :15px;
		padding-bottom :15px;
	}
	main,footer {
		text-align: center;
	}
	footer {
		display: flex;
	    justify-content: center;
		padding-top:15px;
	}
	h1 {
		text-transform: uppercase;
		font-weight: 100;
	}
</style>