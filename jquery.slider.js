/*
 * --------------------------------------------------------------------
 * jQuery-Plugin - converting a select element to a slider
 * by Scott Jehl, scott@filamentgroup.com
 * http://www.filamentgroup.com
 * reference article: http://www.filamentgroup.com/lab/developing_an_accessible_slider/
 * demo page: http://www.filamentgroup.com/examples/slider/
 * 
 * Copyright (c) 2008 Filament Group, Inc
 * Licensed under GPL (http://www.opensource.org/licenses/gpl-license.php)
 *
 * Usage Notes: please refer to our article above for documentation
 *  
 * Version: 1.0, 03.21.08
 * Changelog:
 * 	
 * --------------------------------------------------------------------
 */

// NOTES: 
// Function must be called on container of select menu(s). 
// Container may have one or two selects - a second select must contain the same inner options as it will be driven by the scale of the first select.
// selects containing optgroups will be used for division point labeling
// set optional scaleInterval param to change the interval of values that appear beneath the scale
// set optional sliderWidth param to set a fixed width
// set optional selectsVisible param to keep selects visible

jQuery.fn.makeSlider = function(scaleInterval, sliderWidth, selectsVisible){
	$(this).each(function(){
		//make sure there's no slider in this already
		if($(this).find('.sliderControl').size() > 0) return $(this);
		//make a unique className for finding this slider
		function returnUnique(){
			var ranNum = Math.floor(Math.random()*100);
			if($('.sliderComponent_'+ranNum).size()==0) return ranNum;
			else returnUnique();
		}
		var uniqueID = returnUnique();
		
		$(this).addClass('sliderComponent_'+uniqueID);
		var sliderComponent = $('.sliderComponent_'+uniqueID);

		var scale = [];
		var firstSelect = sliderComponent.find('select:eq(0)');
		//get scale and groups from first select if there are opt groups
		if(firstSelect.find('optgroup').size()>0){
			var optGroups = true;
			firstSelect.find('optgroup').each(function(i){
				var optName = $(this).attr('label');
				scale[i] = {};
				scale[i].name = optName;
				scale[i].values = [];
				$(this).find('option').each(function(j){
					scale[i].values[j] = {};
					scale[i].values[j].value = $(this).attr('value');
					scale[i].values[j].label = $(this).text();
				});
			});
		}
		//if no optgroups, make array of values,labels for each tic
		else{
			firstSelect.find('option').each(function(j){
					scale[j] = {};
					scale[j].value = $(this).attr('value');
					scale[j].label = $(this).text();
				});
		}

		//number of selects becomes number of slide pulls
		var indicators = [];
		sliderComponent.find('select').each(function(i){
			indicators.push($(this).attr('name'));
		});
		if(indicators.length > 2) return 'Too many selects provided to slider component. Max is 2.';
		
		//hide labels and selects unless told otherwise
		if(!selectsVisible) sliderComponent.find('select, label').css({'position': 'absolute', 'top': '-99999px', 'left': '-99999px'});

		//write slider component
		sliderComponent.append('<div class="sliderControl"><div class="scale"></div></div>');
		if(sliderWidth) sliderComponent.width(sliderWidth);
	
		//scale labeling
		if(optGroups) {//write dl
			var xScale = sliderComponent.find('.sliderControl').prepend('<dl class="xScale clearfix"></dl>');
			$(scale).each(function(){
				var thisClass = this.name.camelize(true);
				sliderComponent.find('.xScale').append('<dt class="'+thisClass+'">'+this.name+'</dt>');
				$(this.values).each(function(){
					sliderComponent.find('.xScale').append('<dd class="'+thisClass+'"><span>'+this.label+'</span></dt>');
				});
			});
		}
		else {//write ol
			var xScale = sliderComponent.find('.sliderControl').prepend('<ol class="xScale clearfix"></ol>');
			$(scale).each(function(){
				sliderComponent.find('.xScale').append('<li class="'+this.value+'"><span>'+this.label+'</span></li>');
			});
		}
		if(scaleInterval){
			if(scaleInterval == 'firstLast') scaleInterval = sliderComponent.find('.xScale dd, .xScale li').size();
			var inc = 0;
			sliderComponent.find('.xScale dd, .xScale li').css('text-indent', -999999).each(function(i){
				if(inc == 0) {$(this).css('text-indent', 0);}
				inc++;
				if(inc == scaleInterval) {inc = 0;}
			});
			//make last item visible always
			sliderComponent.find('dl.xScale dd:last, .xScale li:last').css('text-indent', 0);
		}
		
		//get number of tics and write them
		var scaleLength;
		var allValues =[];
		allValues[uniqueID] = [];
		if(optGroups) {
			scaleLength = scale[0].values.length + scale[1].values.length; 
			$(scale[0].values).each(function(){
					allValues[uniqueID].push(this.value);
			});
			$(scale[1].values).each(function(){
					allValues[uniqueID].push(this.value);
			});
		}
		else {
			scaleLength = scale.length; 
			$(scale).each(function(){
					allValues[uniqueID].push(this.value);
			});
		}

		for(var k=0; k<scaleLength; k++) sliderComponent.find('.scale').append('<span></span>');

		//indicators and spans
		var minVal, maxVal;

		minVal = scale[0].value || scale[0].values[0].value;
		maxVal = scale[scale.length-1].value || scale[scale.length-1].values[scale[scale.length-1].values.length-1].value;
		$(indicators).each(function(l){
			var thisInt = parseInt(l)+1;
			sliderComponent.find('.sliderControl').append('<div class="indicator'+thisInt+' sliderIndicator" role="slider" aria-valuemin="'+ minVal +'" aria-valuemax="'+  maxVal+'"></div>');
		});
		if(optGroups){
			sliderComponent.find('.sliderControl').append('<div class="sliderSpan"><div class="blotA"></div><div class="blotB"></div></div>\n');
			//get bg color of first parent that has an explicit bg color and set the blots to that color
			var sliderSpanBG;
			function getParentBG(element){
				var parentEl = element.parent();
				var parentBG = parentEl.css('background-color');
				if(parentBG!='transparent') sliderSpanBG = parentBG;
				else getParentBG(parentEl);
			}
			getParentBG(sliderComponent.find('.sliderSpan:eq(0)'));
			sliderComponent.find('.blotA, .blotB').css('background-color', sliderSpanBG);
		}

		//set some sizing
		
		sliderComponent.find('.scale').width(sliderComponent.width()-35);
		
		sliderComponent.find('.scale span').each(function(n){
			$(this).css('left', (sliderComponent.width()-36) / (scaleLength-1) * n);
		});
		
		sliderComponent.find('.xScale dd, .xScale li').each(function(m){
			$(this).width((sliderComponent.width()) / scaleLength);
			$(this).css('left', (sliderComponent.width()-36) / (scaleLength) * m);
		});
		sliderComponent.find('.sliderSpan, .blotB').width(sliderComponent.width()-36);
		sliderComponent.find('.sliderSpan .blotB').css('left', sliderComponent.width()-36);

		//find starting location for indicators
		 
		//if available, find selected indexes from selects
		var selectedInd = [];
		var xLoc = [];
		var xyLocations = [indicators.length];
		sliderComponent.find('select').each(function(i){
			selectedInd[i] = $(this).find('option:selected').attr('value');
			if(selectedInd[i]){
				var arrayLoc = allValues[uniqueID].indexOf(selectedInd[i]);
				xLoc[i] = (arrayLoc / (scaleLength-1) * (sliderComponent.width()-36));
			}
			else xLoc[i] = 0;
			xyLocations[i] = [xLoc[i], 0];
		});
		
		//set any scrolling parents to pos: rel
		sliderComponent.parents('.scroll').css('position', 'relative');
				
		//slider function
		sliderComponent.Slider({
			accept : '.sliderIndicator',
			restricted: true,
			fractions : scaleLength-1, 
			onSlide : function( cordx, cordy, x , y) {
				var convertX = (x/(sliderComponent.width()-36)*(scaleLength-1)).toFixed();
				var feedback, blot;
				if ($(this).is('.indicator1')) { 
					feedback = sliderComponent.find('.indicatorFeedback1'); 
					blot = 'blotA'; 
					currSelect = sliderComponent.find('select:eq(0)');
				} 
				else { 
					feedback = sliderComponent.find('.indicatorFeedback2'); 
					blot = 'blotB'; 
					currSelect = sliderComponent.find('select:eq(1)');
				}
				//indicator and aria
				if(allValues[uniqueID][convertX]) feedback.html(allValues[uniqueID][convertX]).parent().attr('aria-valuetext', allValues[uniqueID][convertX]).attr('aria-valuenow', allValues[uniqueID][convertX]);
				currSelect.find('option[@value='+allValues[uniqueID][convertX]+']').attr('selected', 'selected');
				if(blot == 'blotA'){
					sliderComponent.find('.sliderSpan .blotA').css('width', Math.round(x));
				}
				else{
					sliderComponent.find('.sliderSpan .blotB').css('left', Math.round(x));
				}
				$('#value').html(''+currSelect.find('option[@value='+allValues[uniqueID][convertX]+']')[0].innerHTML);
			},
			values: xyLocations
		});
		
	});

	$('.sliderIndicator').each(function(k){
		$(this).attr('tabindex', k+1);
	});
		
};


//camelize function, converts spaced string to camelCase
String.prototype.camelize=function(lowFirstLetter)
  {
    var str=this.toLowerCase();
    var str_path=str.split('/');
    for(var i=0;i<str_path.length;i++)
    {
      var str_arr=str_path[i].split(' ');
      var initX=((lowFirstLetter&&i+1==str_path.length)?(1):(0));
      for(var x=initX;x<str_arr.length;x++)
        str_arr[x]=str_arr[x].charAt(0).toUpperCase()+str_arr[x].substring(1);
      str_path[i]=str_arr.join('');
    }
    str=str_path.join('::');
    return str;
  };
  
//array.indexof function: gets location of a val in an array
Array.prototype.indexOf = function( v, b, s ) {
 for( var i = +b || 0, l = this.length; i < l; i++ ) {
  if( this[i]===v || s && this[i]==v ) { return i; }
 }
 return -1;
};
