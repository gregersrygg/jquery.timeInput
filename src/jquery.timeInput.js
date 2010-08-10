/*
 * Fallback for HTML5 time input. Based on spec:
 * http://dev.w3.org/html5/markup/input.time.html
 * 
 * Inspired by the jQuery timePicker plugin:
 *   Sam Collet (http://www.texotela.co.uk)
 *   Anders Fajerson (http://perifer.se)
 * 
 * Haven't used the recommended test to see if the browser supports time input. Chrome will say it
 * does, even though it doesn't. Opera is the only browser by 30.7.2010 that have implemented time
 * input, but it doesn't give any list of suggestions. So I decided to show the list for all
 * browsers.
 * 
 * Tried using <datalist> instead of <ul> for the list, but Opera ignores datalists for time input,
 * and Chrome complains that <option> is not allowed inside a <datalist>.
 * 
 * NB!! $("input[type=time]") doesn't work in Internet Explorer! Use class instead.
 * 
 * Dual licensed under the MIT and GPL licenses.
 * @name     timeInput
 * @version  0.1
 * @author   Gregers Gram Rygg (http://www.gregers.no/ http://www.twitter.com/gregersrygg)
 * @example  $("input.time").timeInput(); // use html5 attributes for time input
 * @example  $("input.time").timeInput({step: 900, startTime: "8:15", endTime: "16:45"});
 */

(function($) {
	
	// private static variables
	var tabKey=9, returnKey=13, escKey=27, upKey=38, downKey=40
		,defaults = {
			step : 900,
			min : "0:00",
			max : "23:45",
			onlyForBrowsersWithoutSupport: false
		}
		,$currentInput
		,keyTimer
		,scrolling = false
		,mouseOverList = false
		,stopRepeatingKeyEvents = false;
	
	$.fn.timeInput = function(options) {
		return this.each(function() {
			$(this).attr('autocomplete', 'OFF')
			.bind("focus click", function(e) {
				if(!m.listIsVisible()) m.showTimePicker(this, options);
				
			}).bind("blur", function(e) {
				if(m.listIsVisible() && !mouseOverList) m.hideTimePicker();
				
			}).bind("change", function(e) {
				var $this = $(this),
					orgTime = $this.val(), time = orgTime;
				if(time && time.indexOf(":") < 0) {
					time = m.insertTimeSeparator(time);
				}
				if(time && time.length < 5) {
					time = m.addZeroes(time);
				}
				
				if( !m.isValidTimeString(time) ) {
					time = "";
				} else if(time) {
					time = m.correctTimeAccordingToSettings(time, $this.data("timeInputSettings"));
				}
				
				if(time != orgTime) {
					$this.val(time);
				}
				
			}).bind("keydown", function keyDownListener(e, keyHeldDownForSteps) {
				if($.browser.opera) return; // Opera won't let us prevent default action
				if(e.keyCode!=upKey && e.keyCode!=downKey) return;
				
				if( !m.listIsVisible() ) {
					return m.showTimePicker(this, options);
				}
				
				if(!keyHeldDownForSteps) keyHeldDownForSteps = 0;
				if(stopRepeatingKeyEvents && keyHeldDownForSteps === 0) return;
				stopRepeatingKeyEvents = true;
				
				if(e.keyCode == upKey) {
					m.prevOption();
				} else {
					m.nextOption();
				}
				
				var waitMs = (keyHeldDownForSteps >= 2 ? 100 : 200);
				keyTimer = setTimeout(function() {
					keyDownListener(e, ++keyHeldDownForSteps);
				}, waitMs);
				
			}).bind("keyup", function(e) {
				stopRepeatingKeyEvents = false;
				clearInterval(keyTimer);
				
				// Hack for Opera, since it won't let us prevent default action on keydown
				if($.browser.opera && (e.keyCode == upKey || e.keyCode == downKey) ) {
					$(this).trigger("input");
				}
				
			}).bind("keypress", function(e) {
				switch(e.keyCode) {
					case returnKey:
						m.chooseSelectedOption();
						e.preventDefault();break;
					case escKey:
					case tabKey:
						m.hideTimePicker();break;
				}
				
			}).bind("input", function(e) {
				var time = $(this).val();
				if(time) {
					if(!m.listIsVisible()) m.showTimePicker(this, options);
					// fill in : if user is writing a time like 800
					time = m.insertTimeSeparator(time);
					m.selectOption("ul.time-input-list:visible li:contains('"+time+"'):first")
				};
			});
		});
	};
	
	// private static methods
	var m = {
		showTimePicker: function(elm, options) {
			$currentInput = $(elm);
			var settings = $.extend( {}, defaults, m.getSettings($currentInput), options);
			settings.step = parseInt(settings.step, 10);
			m.validateSettings(settings);
			$currentInput.data("timeInputSettings", settings);
			
			var $dataList = m.getDataList(settings);
	//		Not good enough support for datalists yet :(
	//		if( ! $currentInput.attr("list") ) {
	//			$currentInput.attr("list", $dataList.attr("id") );
	//		}
			m.positionList($dataList, $currentInput);
			$dataList.show();
			
			if($currentInput.val()) {
				var val = $currentInput.val();
				m.selectOption("ul.time-input-list:visible li:contains('"+val+"')");
			} else {
				m.selectOption("ul.time-input-list:visible li:first");
			}
		},
	
		hideTimePicker: function() {
			$("ul.time-input-list li.selected").removeClass("selected");
			$("ul.time-input-list").hide();
		},
	
		prevOption: function() {
			var $option = $("ul.time-input-list:visible li.selected");
			if( ! $option.is(":first-child") ) {
				m.selectOption( $option.prev() );
			}
		},
	
		nextOption: function() {
			var $option = $("ul.time-input-list:visible li.selected");
			if( $option.size() == 0 ) {
				m.selectOption( "ul.time-input-list:visible li:first-child" );
			} else if( ! $option.is(":last-child") ) {
				m.selectOption( $option.next() );
			}
		},
	
		selectOption: function(element) {
			var $element = $(element).addClass("selected");
			if($element.size() == 0) return;
			$element.siblings().removeClass("selected");
			var $parent = $element.parent();
			var elementTop = $element.get(0).offsetTop;
			var scrollPos = $parent.scrollTop();
			var height = $parent.height() - $element.height();
			
			if( elementTop < scrollPos ) {
				$parent.scrollTop(elementTop);
			} else if( elementTop > scrollPos + height ) {
				$parent.scrollTop(elementTop - height);
			}
			
			scrolling = true;
			setTimeout(function() {
				// prevent mouseover event when mouse cursor is over the list
				// since javascript is synchronious it will be executed after
				// other events are fired.
				scrolling = false;
			}, 0);
		},
	
		chooseSelectedOption: function() {
			var $option = $("ul.time-input-list:visible li.selected");
			if($option.size() == 1) {
				$currentInput.val( $option.text() );
			}
			m.hideTimePicker();
		},

		getSettings: function(input) {
			var $i = $(input), settings = {};
			for(var i=0,a=["step","min","max"],key; key=a[i]; i++) {
				var val = $i.attr(key);
				if(val) settings[key] = val;
			}
			return settings;
		},
	
		validateSettings: function(settings) {
			if(typeof settings.min != "string" || !m.isValidTimeString(settings.min)) {
				throw new Error("min has to be a valid time string (13:45)");
			} else if(typeof settings.max != "string" || !m.isValidTimeString(settings.max)) {
				throw new Error("max has to be a valid time string (13:45)");
			} else if(settings.step < 0 || settings.step > (60 * 60 * 12)) {
				throw new Error("step has to be a number between 0 and 60 * 60 * 12");
			}
		},
	
		listIsVisible: function() {
			return $("ul.time-input-list").is(":visible");
		},
	
		getDataList: function(settings) {
			var key = m.getUniqueKeyFor(settings);
			var $dataList = $("#"+key);
			
			if($dataList.size() != 1) {
				$dataList = $("<ul/>", {
					id: key
				}).addClass("time-input-list");
				
				var timeList = m.generateTimeList(settings);
				for(var i=0,l=timeList.length; i<l; i++) {
					var val = timeList[i];
					$dataList.append( $("<li/>").text(val) );
				}
				
				$dataList.delegate("li", "click", m.chooseSelectedOption)
						.delegate("li", "mouseover", function(e) {
					if(scrolling) return false;
					$(this).siblings().removeClass("selected");
					$(this).addClass("selected");
				});
				
				$dataList.bind("mouseenter", function() {
					mouseOverList = true;
				}).bind("mouseleave", function() {
					mouseOverList = false;
				}).appendTo("body");
				
				m.adjustHeight($dataList);
			}
			return $dataList;
		},
		
		adjustHeight: function($el) {
			var height = $el.height();
			$el.css("height", "auto");
			if( height < $el.height() ) {
				$el.css("height", null);
			}
		},
	
		getUniqueKeyFor: function(obj) {
			var unique = "", keys = [];
			for(var k in obj) {
				keys.push(k);
			}
			keys.sort();
			for(var i=0,l=keys.length; i<l; i++) {
				unique += obj[keys[i]];
			}
			return unique.replace(/[\W]/g, "");
		},
	
		generateTimeList: function(settings) {
			var timeList = [];
			var time = m.dateToTime( m.timeToDate( settings.min ));
			var maxDate = m.timeToDate(settings.max)
			while( m.timeToDate(time) <= maxDate ) {
				timeList.push(time);
				try {
					time = m.addSecondsToTime(time, settings.step);
				} catch(e) {
					break;
				}
			}
			return timeList;
		},
	
		positionList: function($dataList, $currentInput) {
			var style = $.extend( {}, $currentInput.offset(), {
				position: "absolute"
			});
			style.top += $currentInput.height();
			style.top += parseInt($currentInput.css("border-top-width")) || 0;
			style.top += parseInt($currentInput.css("padding-top")) || 0;
			style.top += parseInt($currentInput.css("padding-bottom")) || 0;
			$dataList.css(style);
		},
	
		correctTimeAccordingToSettings: function(time, settings) {
			var date = m.timeToDate(time);
			var minDate = m.timeToDate(settings.min);
			var maxDate = m.timeToDate(settings.max);
			
			if(date < minDate) return m.dateToTime(minDate);
			if(date > maxDate) return m.dateToTime(maxDate);
			
			var stepMinutes = settings.step / 60;
			var minutesFromMinTime = (date.getTime() - minDate.getTime()) / 1000 / 60;
			var minutesFromLastStep = minutesFromMinTime % stepMinutes;
	
			if( minutesFromLastStep >= (stepMinutes / 2) ) {
				date = m.addSecondsToDate(date, (stepMinutes - minutesFromLastStep) * 60);
			} else if( minutesFromLastStep > 0 ) {
				date = m.addSecondsToDate(date, minutesFromLastStep * -60);
			}
			return m.dateToTime(date);
		},
	
		isValidTimeString: function(timeStr) {
			if(timeStr === null || timeStr == "") return true;
			return /^([0,1]?\d|2[0-3]):[0-5]\d:?\d{0,2}$/.test(timeStr);
		},
	
		insertTimeSeparator: function(timeStr) {
			return timeStr.replace(/^(2[0-3]|[0-1]?\d):?(\d{0,2}):?\d{0,2}$/, "$1:$2");
		},
		
		addZeroes: function(timeStr) {
			return timeStr.replace(/(\d{0,2}):(\d{0,2})/, function(str, h, m) { while(h.length < 2) h = "0" + h; while(m.length < 2) m += "0"; return h+":"+m });
		},
	
		dateToTime: function(date) {
			if(date.getDate() !== 1) {
				throw new Error("Date has to be Jan 1st 1970 when converting to time");
			}
			return date.toTimeString().substring(0,5);
		},

		timeToDate: function(timeStr) {
			return new Date("Jan 1 1970 " + timeStr);
		},
	
		addSecondsToTime: function(time, secs) {
			var date = m.addSecondsToDate( m.timeToDate(time), secs);
			return m.dateToTime( date );
		},
	
		addSecondsToDate: function(date, secs) {
			var time = date.getTime();
			return new Date(time + secs * 1000);
		}
	};
	
	$.timeInput = m;

})(jQuery);
