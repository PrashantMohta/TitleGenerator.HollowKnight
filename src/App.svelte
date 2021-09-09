<script>
	import { onMount } from 'svelte';
	import { getParam, getDefaultText , rAF ,canvasHelper , BannerParams} from './utils';

	let link = "";
	let text = getDefaultText();
	let titleCanvas;
	let enableBlur = getParam("title") == "true" || true;
	let multiplier = 1.71;
	let allBanners = [
		new BannerParams(
			"Base",
			"Assets/banner.png",{
			size : {width: 1274, height: 521},
			superText:{ size : 32, ypos : 135},
			mainText:{ size : 128, ypos : 215},
			subText:{ size : 32, ypos : 270}
		}),
		new BannerParams(
			"Hi-res",
			"Assets/bannerhires.png",{
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
			needsShadow : true,
			blur : 10,	
			size : {width: 2200, height: 663},
			superText:{ size : 32*1.71, ypos : 135*1.71},
			mainText:{ size : 128*1.71, ypos : 215*1.71},
			subText:{ size : 32*1.71, ypos : 270*1.71}
		})
	]
	let selectedTitleIndex = 0;
	try{
		selectedTitleIndex = parseInt(getParam("title")) || 0;
	} catch (e){}

	let currentBanner = allBanners[selectedTitleIndex];
	let cH;
	function updateLink(){
		let templink = `${window.location.origin}${window.location.pathname}?title=${selectedTitleIndex}&blur=${enableBlur}&${text.superText && `super=${text.superText}&`}${text.mainText && `main=${text.mainText}&`}${text.subText && `sub=${text.subText}`}`;
		if(link != templink){
			link = templink;
			window.history.pushState(link,"Title Change",link);
		}
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
					blur: enableBlur ? currentBanner.blur : 0,
					color:currentBanner.color
				}
			);
			cH.addText(text.mainText.toUpperCase(),
				{	
					size:currentBanner.mainText.size + (!text.superText? currentBanner.superText.size : 0) + (!text.subText? currentBanner.subText.size : 0),
					ypos:currentBanner.mainText.ypos - (!text.superText? currentBanner.superText.size/2 : 0) + (!text.subText? currentBanner.subText.size/2 : 0),
					blur: enableBlur ? currentBanner.blur : 0,
					color:currentBanner.color
				}
			);
			cH.addText(text.subText.toUpperCase(),
				{
					...currentBanner.subText,
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
			<canvas bind:this={titleCanvas} width="{currentBanner.size?.width}" height="{currentBanner.size?.height}"></canvas>
		</div>	
		<div class="pure-u-1 pure-u-md-1-6">
			<div>
				<div class="pure-g">
					<label class="pure-u-1 pad-v">Title</label> 
					<select class="pure-u-1"  bind:value={selectedTitleIndex} on:change="{() => { currentBanner = allBanners[selectedTitleIndex]}}">
						{#each allBanners as banner,index}
							<option value={index}>
								{banner.name}
							</option>
						{/each}
					</select>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">
						<input type=checkbox bind:checked={enableBlur}>
						Enable Blur
					</label>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">Super</label> 
					<input class="pure-u-1" bind:value={text.superText} type="text" ><br>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">Main</label> 
					<input class="pure-u-1" bind:value={text.mainText} type="text" ><br>
				</div>

				<div class="pure-g">
					<label class="pure-u-1 pad-v">Sub</label> 
					<input class="pure-u-1" bind:value={text.subText} type="text" ><br>
				</div>
				
				<div class="pure-g pad-v-2">
					<button class="pure-u-1" on:click={cH.download(`${text.superText}${text.mainText}${text.subText}`)}> Download </button>
				</div>
			</div>
		</div>	
	</div>
	<div>
		<div class="pure-u-1 pure-u-md-1-2 pad-v">
			Sharable url 
		</div>
		<div class="pure-u-1 pure-u-md-1-2">
			<a href="{link}">{link}</a>
		</div>
	</div>
</main>

<style>
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
	canvas {
		background:#16213E;
		width:100%;
	}
	main {
		text-align: center;
		margin: 0 auto;
	}

	h1 {
		text-transform: uppercase;
		font-weight: 100;
	}
</style>