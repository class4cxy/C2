/*
 * Cxy JavaScript Library
 * Create time 2011-05-15 9:28
 * Copyright (c) 2011 design by cxy.
 * mysite http://www.jdoi.net/
 */
/*
 * @progress
 * 1.0.3 - 20120904 - 添加命名空间 request; 原有的ajax, getJ, get, getX, post 移植到 request上
 * 2.0.0 - 20130124 - 基本重构 C ,引入 sizzle, 逐渐组件化
 *         20130211 - 内部不再做dom节点查找，所有传递均采用 Sizzle查找的dom对象
 *         20130322 - 修改 include 方法，支持异步/同步加载，去除 use 方法，去除 plugin 属性
 *                    文件加载不再以功能模块为单位，以文件为单位！
 *                    修复相同文件同时加载造成的重载问题
 */
 
(function () {

var C = {},

    toString = Object.prototype.toString,
	
	Root = "http://www.jdoi.net/C/",
	
	rTagStyle = /<style.*?>([^<]*)<\/style>/ig,
	// regular of query
	rQuery = /[\?|&](.*?)=([^&#\\$]*)/g,
	// global unique id
	Guid = 1,
	// document head
	dHead = document.getElementsByTagName("head")[0],
	// document body
	dBody = document.body,
	// turn on this , all the console.log will work.
	DebugMode = !!1;

/**
 * NameSpace 工具集
 * 20130130
 * .versionComparison
 * .isArray
 * .each
 * .copy
 * .queryMap
 * .isEmptyObject
 */
C.Util = {
	
	/**
	 * Function 版本号对比
	 * @param {string} v1
	 * @param {string} v2
	 * v1 > v2 return -1
	 * v1 = v2 return  0
	 * v1 < v2 return  1
	 * 20130213
	 */
	versionComparison : function ( v1, v2 ) {
		
		var firstArr = v1.split('.'),
			lastArr  = v2.split('.'),
			i = 0,
			len = Math.min( firstArr.length, lastArr.length ),
			item1,
			item2;
		
		for ( ; i < len; i++ ) {

			item1 = parseInt(firstArr[i]);
			item2 = parseInt(lastArr[i]);
			if ( item1 > item2 ) return -1;
			if ( item1 < item2 ) return  1;

		}
		return 0;
		
	},
	/**
	 * Function isArray 是否Array Object
	 * @param {any type} obj 需要检测的变量
	 * 20130131
	 */
	isArray : function ( obj ) {
		// 支持 isArray 属性浏览器
		return Array.isArray && Array.isArray( obj ) ||
			// or
			obj.constructor === Array;
	},
	/**
	 * Function each : 遍历数组或者对象
	 * @param {object|array} obj 需要遍历的对象
	 * @param {function} callback 回调函数
	 * 20111022
	 */
	each : function( obj, callback ) {
		var i,
			len = obj.length;
		
		// Array
		if ( C.Util.isArray( obj ) ) 

			for ( i = 0; i < len; i++ ) 

				callback && callback( i, obj[ i ] );

		// Object
		else 
			
			for ( i in obj ) 
				// 防止遍历通过new而获得的属性
				if ( obj.hasOwnProperty(i) ) 
					
					callback && callback( i, obj[ i ] );

	},
	/**
	 * Function 数组，对象深度拷贝
	 * 支持[object Object] [object Array] 两种类型数据合并
	 * 支持合并无限个参数
	 * 支持对象类型检测，类型不统一将跳过执行并输出不统一的数据类型
	 * 支持深度复制
	 * 重写 (value1, undefined, null, !1, "") | value2 -> value2
	 * 跳过执行 value1 | (undefined, null, !1, "", value1) -> value1
	 * 20130127
	 */
	copy : function () {
		
		var len = arguments.length,
			i = 0,
			re,
			item,
			type;

		function _ErrorType (key, val) {
			
			console.log( 'You enter the error type of arguments['+ key +']: ' + toString.call(val) );
		}
		
		function _deep () {
			
			var ancestor,
				target;
			
			if ( (ancestor = arguments[1]) && (target = arguments[0]) ) {
		
				each( ancestor, function ( k, v ) {
					
					// value1 | (undefined, null, !1, "", value1) -> value1
					// window || HTMLElement will be skip
					if ( !v && target[k] || target[k] === v || v.noteType || v.window == window ) return;
		
					if ( toString.call(v)==="[object Array]" ) {
						
						_deep( target[k] = [], v );
			
					} else if ( toString.call(v)==="[object Object]" ) {
						
						_deep( target[k] = {}, v );
	
					} else target[k] = v;
					
				});
			}
			
		}
		
		// 遍历参数
		for ( ; i < len; i++ ) {
			
			item = arguments[i];
			
			if ( toString.call(item)==="[object Array]" ) {
				
				//以第一个参数的数据类型为准
				if ( !i ) {
					re = [];
					type = "[object Array]";
				}
				if ( type !== "[object Array]" ) {
					_ErrorType( i, item );
					continue;
				}
	
			} else if ( toString.call(item)==="[object Object]" ) {
				
				//以第一个参数的数据类型为准
				if ( !i ) {
					re = {};
					type = "[object Object]";
				}
				if ( type !== "[object Object]" ) {
					_ErrorType( i, item );
					continue;
				}
				
			} else {
				
				_ErrorType( i, item );
				if ( !i )
					return;
				else
					continue;
			}
			
			_deep(re, item);
			
		}
		return re;
	},
	/**
	 * Function query to map
	 * @param [string] url
	 * 20121113
	 */
	queryMap : function ( url ) {
		
		var realUrl = url || document.location.href,
			map = {};

		realUrl.replace( rQuery, function ( a, b, c ) {

			b && c && ( map[b] = c );

		});

		return map;		
	},
	/**
	 * Function isEmptyObject 检测对象是否非空
	 * @param {string} obj 需检测的对象
	 * 20120806
	 */
	isEmptyObject : function ( obj ) {
		
		for ( var i in obj ) {
		
			return !!0;
		
		}
		return !!1;

	},
	
	/**
	 * Function queue 简单队列机制
	 * .add 增加队列
	 * .execute 执行队列
	 * 20130405
	 */
	queue : function () {
		
		var Events = [];
		
		return {
			
			add : function (evt) {
				Events[Events.length] = evt;
			},
			
			execute : function () {
				
				each( Events, function (index, item) {
				
					item();
				
				});
				// clear
				Events = [];
				
			}
			
		}
	}
}
// quote
var each = C.Util.each;

/**
 * NameSpace 信息输出操作
 * 20130211
 * .log
 * .warn
 * .error
 */
C.Throw = (function () {

	function _print( type, text ) {
		
		DebugMode && !!console && !!console[type] && console[type]('C ' + Number(new Date()) + ': ' + text);
		
	}
	return {
		log : function ( msg ) {
			_print( 'log', msg )
		},
		warn : function ( msg ) {
			_print( 'warn', msg )
		},
		error : function ( msg ) {
			_print( 'error', msg )
		}
	}
})();
// quote
var log   = C.Throw.log,
	warn  = C.Throw.warn,
	error = C.Throw.error;

/**
 * Object 浏览器属性检测
 * 返回主流浏览器
 * 返回渲染核心
 * 返回版本号
 * 201301
 */
C.Browser = (function () {

	var _ua = navigator.userAgent,
	
		_browser = {
			
			ie      : /msie\s(\d+\.\d)/gi,
			
			firefox : /firefox\/(\d+\.\d)/gi,
			
			safari  : /version\/(\d+\.\d\.\d).*safari/gi,
			
			opera   : /opera.*version\/(\d+\.\d+)/gi,
			
			chrome  : /chrome\/([^\s]+)/gi
		},
		
		_render = {
			
			ie     : /msie/gi,
			
			webkit : /webkit/gi,
			
			gecko  : /gecko/gi,
			
			opera  : /opera/gi
		},
		
		_checkUrl = "Browser.json",
		
		_result = {};
		
	
	for ( var i in _browser ) 
	
		if ( _browser[i].test( _ua ) ) {
			
			_result[i] = RegExp['$1'];
			break;
		}
	
	for ( var j in _render ) 
	
		if ( _render[j].test( _ua ) ) {
			
			_result.render = j;
			break;
		}

	return _result;
	
})();

/**
 * @function 收录不同浏览器下的特殊属性，不断更新
 * @create time : 20110930
 * @nameSpace : C
 */
C.DIFF = (function(){

	var isIe = C.Browser.ie,
		ver  = parseInt(isIe);

	return {
		"class"      : isIe && ver < 8 ? "className" : "class",
		"doi"        : isIe ? "readystatechange" : "DOMContentLoaded",
		"innerText"  : isIe ? "innerText" : "textContent",
		"mouseenter" : isIe ? "mouseenter" : "mouseover",
		"mouseleave" : isIe ? "mouseleave" : "mouseout"
	}

})();

/**
 * NameSpace 页面信息
 * 20111130
 * .info
 * .box
 */
C.page = {

	/**
	 * Function 返回页面即时的信息，包括页面高度，宽度，浏览器可见域高度，宽度，页面当前滚动高度
	 * param [dom] elem对象
	 * 20111130
	 * fix : 20120626 - 添加普通标签的信息返回
	 */
	info : function( elem ) {
		
		var obj = !elem || elem === document ? window : elem;
		if ( typeof obj !== 'object' ) return log( 'typeof elem must be object.' );
		return obj === window ?
		{
			//页面高度
			PH : window.innerHeight + window.scrollMaxY || document.body.scrollHeight,
			//页面宽度
			PW : window.innerWidth + window.scrollMaxX || document.body.scrollWidth,
			//浏览器可见域高度
			WH : document.documentElement.clientHeight,
			//浏览器可见域宽度
			WW : document.documentElement.clientWidth,
			//页面当前滚动高度
			ST : document.documentElement.scrollTop || document.body.scrollTop
		}
		:
		{
			//容器可见域高度
			WH : elem.clientHeight,
			//容器可见域宽度
			WW : elem.clientWidth,
			//容器当前滚动高度
			ST : elem.scrollTop
		}
	},
	/**
	 * Function 返回容器在页面的居中坐标
	 * param {number} height box高度
	 * param {number} width box宽度
	 * param {boolean} fix fixed定位标志
	 * 20111130
	 */
	box : function( height, width, fix ) {
		
		var page    = C.page.info(),
			version = parseInt( C.Browser.ie );

		return{
			x : ( page.WW - width )/2,
			y : ( page.WH - height )/2 + (fix && version < 7 ? 0 : page.ST)
		}
	}
}

/**
 * NameSpace 关于数组的操作
 * 20130130
 */
C.Array = {
	
	copy : C.Util.copy,
	
	/**
	 * Function 返回元素在数组中的位置
	 * @param {array} arr 数组
	 * @param {string|object|array|function} item 要判断的元素
	 * 20130210
	 */
	indexOf : function ( arr, item ) {
		
		var len = arr.length;
		
		if ( !C.Util.isArray(arr) || !len ) return -1;

		if ( !!arr.indexOf ) {
			
			while ( len-- ) 
			
				if ( arr[len] === item ) 
				
					return len;

			return -1;
		// 支持 indexOf 属性
		} else return arr.indexOf( item );

	}
}

/**
 * NameSpace 关于对象的操作
 * 20130130
 */
C.Object = {

	copy : C.Util.copy,
	
	add : function ( obj ) {
		
		
		
	}

}

/**
 * Function 节点包装，构造函数
 * @param {array} elems 节点数组
 * 20130205
 */

var _domConstructor = function ( doms ) {
	
	this.doms = doms;
	
}

// copy property from C._fn
_domConstructor.prototype = C._fn = {};
// 纠正构造函数
_domConstructor.prototype.constructor = _domConstructor;

this.$D = function ( elems ) {

	if ( !elems || 'object' !== typeof elems ) return null;
	return new _domConstructor( C.Util.isArray(elems) ? elems : [elems] );

};
/**
 * Function 节点方法的扩展接口
 * @param {String|Object} handle
 * @param [Function|Object] fn
 * 20130208
 */
C._fn._extend = C.extend = function ( handle, fn ) {

	
	var belong,
		property,
		i;
	
	// extend to handle
	if ( (property = fn) !== undefined ) {
		
		if ( (belong=this[handle]) === undefined ) belong = this[handle] = {};

	}
	// extent to this
	else {

		belong = this;
		property = handle;

	}

	if ( toString.call( property ) === "[object Object]" ) {

		for ( i in property ) {
			
			if ( property.hasOwnProperty(i) ) {
				
				if (belong[ i ]) log('property "'+ i +'" in "'+ belong +'" has been rewrite.');
				belong[ i ] = property[ i ];

			}

		}

	} else this[handle] = property;

}
/**
 * NameSpace 关于事件的操作
 * 20130130
 * .on
 * .un
 * .stopPropagation
 * .parentDefault
 */
C.Event = {
	
	/**
	 * Function 给指定DOM节点绑定事件监听器
	 * @param {object dom} elem 节点
	 * @param {string} type 监听类型
	 * @param {function} fn 监听器
	 * @param [object dom] selector 代理节点（使用代理方式绑定）
	 * 20130210
	 */
	on : function ( elem, type, fn, selector ) {
		
		var realType = C.DIFF[type] || type,
			
			item,
			
			// 公共的事件监听处理
			sm = function( evt ) {

				var obj = evt.target || evt.srcElement,
					index;
				
				if ( ( type == "mouseenter" || type == "mouseleave" ) && !C.Browser.ie ) {

					var related = evt.relatedTarget,
						current = evt.currentTarget;
					// check, come from baidu's tangram
					if (
						// 如果current和related都是body，contains函数会返回false
						related == current ||
						// Firefox有时会把XUL元素作为relatedTarget
						// 这些元素不能访问parentNode属性
						// thanks jquery & mootools
						//如果current包含related，说明没有经过current的边界
						related &&

						( C.Dom.contains( current, related ) || related.prefix == 'xul')

					) return;
				}
				// on live
				if ( selector && selector.length ) {
					
					// match itself or contains the target
					if ( (index=C.Array.indexOf(selector, obj))>-1 || (index=__contains(selector, obj))>-1 ) 
				
						fn && fn.call( selector[index], evt );
				
				// on bind
				} else {
					
					each( elem.Event[realType].fns, function ( key, fn ) {
				
						fn.call( elem, evt );
		
					});
					
				}
			};
		
		// 返回目标节点的上级节点的key
		// 不包含则返回-1
		function __contains ( elems, tag ) {
			
			each( elems, function ( key, val ) {
				
				if ( C.Dom.contains(val, tag) ) return key;
				
			});
			return -1;
			
		};
		// deal with elem's events
		if ( !elem ) return;

		if ( !elem.Event ) elem.Event = {};

		item = elem.Event[realType];
		
		if ( !item ) {
			
			item = elem.Event[realType] = {};
			item.fns = [];
			item.realFn = sm;
			
			document.attachEvent ?
		
				elem.attachEvent( 'on'+realType, sm )
			:
				elem.addEventListener( realType, sm, false );
		
		}

		item.fns.push( fn );
		
	},
	/**
	 * Function 给指定DOM节点解除事件监听
	 * @param {object dom} elem 节点
	 * @param {string} type 监听类型
	 * @param [function] fn 监听器
	 * 20130210
	 */
	un : function ( elem, type, fn ) {
		
		var realType = C.DIFF[type] || type,
		
			realFn,
			
			Fns;
		
		// remove the listener and distroy it
		function _clear ( e ) {
			// get the realy function
			realFn = e.Event[realType].realFn;

			document.detachEvent ?
				
				e.detachEvent( 'on'+realType, realFn )
			:
				e.removeEventListener( realType, realFn, false );
				
			delete e.Event[realType];
			
		}
		
		if ( elem.Event && (Fns = elem.Event[realType].fns) && !!Fns.length ) {
			
			// no EventListener
			if ( !fn ) return _clear( elem );

			var index = C.Array.indexOf( Fns, fn );
			
			// can find the listener 
			index > -1 && 
			// remove in the queue of Fns
			Fns.splice(index, 1) && 
			// then, check the Fns.length
			!Fns.length && 
			// when Fns.length == 0, goto _clear
			_clear( elem );
			
		}
		
	},
	/**
	 * Function 阻止冒泡事件
	 * @param {event object} e 事件对象
	 * 20120305
	 */
	stopPropagation : function ( e ) {
		
		e.stopPropagation ? e.stopPropagation() : e.cancelBubble = !1;
	},
	/**
	 * Function 阻止事件默认行为
	 * @param {event object} e 事件对象
	 * 20120305
	 */
	parentDefault : function ( e ) {
		
		e.preventDefault ? e.preventDefault() : e.returnValue = !1;
	},
	/**
	 * Function key.on 支持 组合键 (ctrl,shift,alt)；
	 * 支持 同一按键上绑定不同方法，会按照绑定先后顺序而执行；
	 * @param expression{string} 按键表达式
	 * @param callback{function} 回调
	 * 不允许单独绑定 组合键
	 * ps: 不支持 主要是由于 目前没有这变态的需求；
	 *     减少逻辑代码量
	 * use: C.Event.key.on("ctrl + delete", function (){console.log("do it")});
	 * date: 20130115
	 * design by J.do 
	 */
	 /**
	 * Function key.un 卸载整个键盘监听事件
	 * 卸载指定按键的指定事件
	 * 卸载指定按键的所有监听事件
	 * @param [string]  arguments[0] 按键表达式
	 * @param [function]arguments[1] 监听器
	 * use: C.Event.key.un("a", listener);
	 *      C.Event.key.un("a");
	 *      C.Event.key.un();
	 * 20130218
	 * design by J.do 
	 */
	key : (function () {

		var _FnKey = {
	
				CTRL  : "ctrlKey",
				ALT   : "altKey",
				SHIFT : "shiftKey"
	
			},
	
			_CodeMap = {
	
				"ESC"      : 27,
				"ENTER"    : 13,
				"SPACE"    : 32,
				"DELETE"   : 46,
				"PAGEUP"   : 33,
				"PAGEDOWN" : 34,
				"UP"       : 38,
				"DOWN"     : 40,
				"LEFT"     : 37,
				"RIGHT"    : 39
	
			},
	
			_isPressFnKey = function (e) {
	
				for ( var i in _FnKey )
	
					if ( e[_FnKey[i]] ) return !0;
	
				return !1;
	
			},
	
			_Condition = function ( exps ) {
	
				// Fn + ~
				if ( /\+/g.test(exps) ) {
	
					return exps
						.replace( "+", "&&")
						.replace( /(\w+)/g, function ( a ) {
	
							if ( a ) {
					
								if ( _FnKey[a] ) return "e." + _FnKey[a];
								
								return _CodeMap[a] ?
								
									"e.keyCode === " + _CodeMap[a]
								:
									"String.fromCharCode(e.keyCode) === '" + a + "'";
								
							}
	
						});
					
				} else {
					
					return _CodeMap[exps] ?
						
						// other word key
						"e.keyCode === " + _CodeMap[exps] + " && !_isPressFnKey(e)"
					:
						// A-Z0-9
						"String.fromCharCode(e.keyCode) === '" + exps + "'";
				}
				
			},
			
			_listener = function ( e ) {
				
				each( document.keyEvents, function ( k, v ) {
	
					if ( eval(v.exp) ) {
						
						each( v.listener, function ( m, n ) {
							
							n.call( v, e );
							
						})
						
					}
					
				});
				
			},
			// remove all the events
			_unAll = function () {
				
				C.Event.un( document, "keydown", _listener );
				delete document.keyEvents;
				
			},
			// remove all the "key"'s events
			_unType = function ( type ) {
	
				delete document.keyEvents[type];
				// when global key event is empty, remove all the events
				C.Util.isEmptyObject(document.keyEvents) && _unAll();
				
			};
	
		return {

			on : function ( expression, listener ) {
	
				var exps   = expression.replace(/\s/g, "").toUpperCase().split(','),
					events = document.keyEvents;
				
				if ( !events ) events = document.keyEvents = {};
	
				// listen global keydown event
				C.Util.isEmptyObject(events) && C.Event.on( document, "keydown", _listener );
				
				each( exps, function ( k, v ) {
					
					if ( !_FnKey[v] ) {
		
						var item = events[v];
	
						// create for first time
						if ( !item ) {
							
							item          = events[v] = {};
							item.exp      = _Condition( v );
							item.self     = v;
							item.listener = [];
	
						}
						
						item.listener.push( listener || function () {} );
		
					} else console.log("You can't add event listener only on the following key : Ctrl,Shift,Alt");
				
				});
			},

			un : function () {
				
				var events = document.keyEvents;
		
				if ( events || !C.Util.isEmptyObject(events) ) {
					
					var len = arguments.length;
					
					// remove all the events
					if ( len == 0 ) {
						
						_unAll();
						
					} else {
						
						var exps = arguments[0].replace(/\s/g, "").toUpperCase().split(','),
							item,
							arg1 = arguments[1],
							index,
							listener;
	
						each( exps, function ( k, v ) {
	
							if ( (item=events[v]) !== undefined ) {
								
								// remove all the key's events
								if ( len === 1 ) {
									
									_unType( v );
									
								} else {
	
									//console.log(  )
									// when arg1 in item.listener, goto remove it
									(index = C.Array.indexOf( (listener = item.listener), arg1 )) > -1 && 
									// when remove success, check the listener is empty ?
									!!listener.splice( index, 1 ) && 
									// if empty then goto remove all the "key"'s events
									!listener.length && _unType( v );
	
								}
								
							}
	
						});
	
					}
					
				}
				
			}
		}
		
	})()
};

/**
 * 事件操作
 * 20130214
 * .on
 * .un
 * .live
 * .unlive
 */
C._fn._extend({
	/**
	 * Function 给指定DOM节点绑定事件监听器
	 * @param {type} 监听类型
	 * @param {fn} 监听器
	 * 20130210
	 */
	on : function( type, fn ) {
		
		var on = C.Event.on;
		
		each( this.doms, function ( key, val ) {
			
			on( val, type, fn );

		});
		 
		return this
	},
	/**
	 * Function 取消绑定指定DOM节点事件监听器
	 * @param [type] 监听类型，若没有，则卸载该节点所有监听
	 * @param {fn} 监听器，若没有，则卸载该类型中的所有监听器
	 * 20130210
	 */
	un : function ( type, fn ) {
		
		var un = C.Event.un;
		
		each( this.doms, function ( key, val ) {
			
			un( val, type, fn );

		});
		 
		return this;
		
	},
	/**
	 * function 添加事件代理
	 * @param {string} type 监听类型
	 * @param {array} selector 需要代理的子节点对象，以数组方式传递
	 * @param {function} fn 监听函数
	 * 20120709
	 * fix 20130211 : 更改selector数据类型，不再做节点查找，将需要监听的节点对象以数组的形式通过selector传递
	 */
	live : function ( type, fn, selector ) {
		
		var on = C.Event.on;
		
		each( this.doms, function ( key, val ) {
			
			on( val, type, fn, selector );

		});
		 
		return this;
	},
	/**
	 * function 解除事件代理
	 * @param {type} 监听类型告
	 * @param {fn} 监听函数
	 * @nameSpace : C._cls
	 * @Create time : 20120725
	 */
	unlive : function ( type, fn ) {
		
		var un = C.Event.un;
		
		each( this.doms, function ( key, val ) {
			
			un( val, type, fn );

		});
		 
		return this;
	}
});

/**
 * style操作
 * 20130214
 * _setCss
 * _getCss
 * .css
 */
C._fn._extend((function () {
	
	function _setCss ( elem, map ) {

		each( map, function ( name, value ) {
			
			if ( name === 'opacity' ) {
			
				if ( C.Browser.ie ) {
					
					name  = 'filter';
					value = 'alpha(opacity='+value+')';

				} else 

					value = parseInt(value)/100;
			}
			elem.style[ name ] = value;
			
		});
	}

	function _getCss ( elem, name ) {
	
		var val;
		//for IE filter	
		if ( elem.currentStyle && name === 'opacity' ) {
			
			val = /opacity=([^)]*)/.test( elem.currentStyle.filter || '' ) ? ( parseFloat( RegExp.$1 ) / 100 ) + '' : '';
			return val === '' ? 1 : val;
		}
		//for inline style
		if ( elem.style[ name ] ) {
			
			val = elem.style[ name ];
		
		//for IE
		} else if ( elem.currentStyle ) {
	
			val = elem.currentStyle[ name ];

		//for W3C
		} else if ( getComputedStyle ) {
	
			name = name.replace( /([A-Z])/g, '-$1' ).toLowerCase();
			var defaultView = elem.ownerDocument.defaultView;
	
			if ( !defaultView ) {
				return null;
			}
	
			var computedStyle = defaultView.getComputedStyle( elem, null );
	
			if ( computedStyle ) {
	
				val = computedStyle.getPropertyValue( name );
			}
		}
		return val;
	}
	return {
		
		/**
		 * Function 批量设置DOM样式值
		 * @param 
		 * 20110930
		 * use : $D('#dom').css({height : '100px', width : '300px'})
		 */
		css : function(name, val){

			var map  = {},
				arg0 = arguments[0],
				len  = arguments.length;

			if ( len == 1 && "string" === typeof arg0 ) {
				
				return _getCss( this.doms[0], name );
				
			}
			if ( len == 2 ) {
			
				map[ arg0 ] = arguments[1];
	
			} else if ( toString.call(arg0) === "[object Object]" ) {
				
				map = arg0;
			
			}
			each( this.doms, function ( index, elem ) {
			
				_setCss( elem, map );
			
			});
			return this;
		},
		/**
		 * Function show方法的简单调用
		 * @param [number] value
		 * 20111205
		 */
		show : function ( value ) {
			
			return this.css({
			
				"display" : "block",
				"opacity" :  value || 100
			
			});
			
		},
		/**
		 * Function hide方法的简单调用
		 * 20111205
		 */
		hide : function () {
			
			return this.css({
			
				"display" : "none",
				"opacity" :  0
			
			});
			
		},
		/**
		 * Function opacity方法的简单调用
		 * @param [number] value
		 * 20111205
		 */
		opacity : function( value ){
	
			return this.css( value !== undefined ? {opacity : value} : "opacity" );
			
		},
		/**
		 * Function height : size方法的简单调用
		 * @param [string] value
		 * 20111205
		 */
		height : function( value ) {
			
			return this.css( value !== undefined ? {height : value} : "height" );
			
		},
		/**
		 * Function width : size方法的简单调用
		 * @param [string] value
		 * 20111205
		 */
		width : function( value ) {
			
			return this.css( value !== undefined ? {width : value} : "width" );
			
		},
		/**
		 * Function top : size方法的简单调用
		 * @param [string] value
		 * 20111205
		 */
		top : function( value ) {
			
			return this.css( value !== undefined ? {top : value} : "top" );
			
		},
		/**
		 * Function left : size方法的简单调用
		 * @param [string] value
		 * 20111205
		 */
		left : function( value ) {
	
			return this.css( value !== undefined ? {left : value} : "left" );
			
		},
		/**
		 * Function top : size方法的简单调用
		 * @param [string] value
		 * 20111205
		 */
		bottom : function( value ) {
			
			return this.css( value !== undefined ? {bottom : value} : "bottom" );
			
		},
		/**
		 * Function left : size方法的简单调用
		 * @param [string] value
		 * 20111205
		 */
		right : function( value ) {
	
			return this.css( value !== undefined ? {right : value} : "right" );
			
		}
		
	}
	
})());

C._fn._extend({
	/**
	 * Function 为dom节点插入HTML代码或者返回innerHTML
	 * 20111002
	 * @parma html{string|null}
	 * fix : 20120629 - 在IE8以下的浏览器增加了对style标签插入的渲染
	 */
	html : function ( html ) {
		
		var create = C.Dom.create,

			styleText = "",
			
			version = C.Browser.ie ? parseInt(C.Browser.ie) : 9;

		if ( version < 9 && !!html ) {
				
			html = html.replace( rTagStyle, function( k, b, f, g ){
					
				if ( b ) styleText += b;
				if ( k ) return '';
				
			});

			if ( styleText ) {

				var style = create( 'style', {type : 'text/css'} );
				
				try{ style.styleSheet.cssText = styleText }catch(e){};
				
				dHead.appendChild( style );
			}
		}
		
		if ( html !== undefined ) {
			
			each( this.doms, function ( index, elem ) {
			
				elem.innerHTML = html;
				
			});

		} else return this.doms[0].nodeType == 1 ? this.doms[0].innerHTML : null;
		
		return this;
		
	},
	/**
	 * Function 为dom节点插入文本或者返回节点中文本
	 * 20111002
	 * @parma text{string|null}
	 */
	text : function( text ) {

		var innerText = C.DIFF.innerText;
		
		if ( text !== undefined ) {

			each( this.doms, function ( index, elem ) {
				
				elem[ innerText ] = text;
				
			});

		} else return this.doms[0][innerText];
		
		return this;
	}
	
});

/**
 * 属性操作
 * 20130214
 * _attr
 * .setAttr
 * .getAttr
 * .delAttr
 * .setClass
 * .getClass
 * .delClass
 */
C._fn._extend((function (){
	
	// add or get attribute
	function _attr ( elem, types, method ) {
		
		// get attribute
		// string
		if ( 'string' === typeof types ) {
			
			return elem[method]( C.DIFF[types] || types );
		
		// del or set attribute
		// object
		} else {

			each( types, function ( k, v ) {

				elem[method]( C.DIFF[k] || k, v );

			});
			
		}
	}
	
	return {
		/**
		 * Function 给DOM节点添加属性
		 * 20110930
		 * @parma arguments[0]{string|object Object}
		 * @parma arguments[1]{string|null}
		 * tips : 不兼容style属性设置，请用css方法替换
		 */
		setAttr : function() {
	
			var map = {};

			if ( arguments.length === 2 ) {
			
				map[ arguments[0] ] = arguments[1];
	
			} else map = arguments[0];
			
			each( this.doms, function ( index, elem ) {
			
				_attr( elem, map, "setAttribute" );
			
			});
	
			return this
		},
		/**
		 * Function 删除指定节点属性
		 * 20111114
		 * @parma type{string} 指定属性 type1 type2 type3 ...
		 * tips : 不兼容删除style属性值
		 */
		delAttr : function( type ) {
	
			var types = {};

			// 处理参数格式，保持与_attr 一致
			each( type.split(' '), function ( key, val ) {

				types[val] = !!0;

			});
			
			each( this.doms, function ( index, elem ) {
				
				_attr( elem, types, "removeAttribute" );
				
			});
	
			return this
		},
		/**
		 * Function 获取DOM节点属性
		 * 20111001
		 * @parma type{string}
		 * tips : 不兼容获取style属性值
		 */
		getAttr : function( type ) {

			return _attr( this.doms[0], type, "getAttribute" );

		},
		/**
		 * Function 添加CLASS
		 * 20120817
		 * @parma val{string} class1 class2 class3 ...
		 * @tips : 支持添加多个CLASS值，若有相同名，则跳过
		 */
		addClass : function ( val ) {
			// val is undefined
			if ( val !== undefined ) {
				
				var oldClass,
					queue = val.split(' '),
					cReg;

				each( this.doms, function ( index, elem ) {

					oldClass = _attr( elem, "class" );
						
					if ( !oldClass ) return _attr(elem, {"class" : val}, "setAttribute");
					// if class had exist will not be add again
					each( queue, function ( k, v ) {

						cReg = new RegExp( '\\b'+v+'\\b', 'ig' );
						if ( !cReg.test(oldClass) ) oldClass += ' ' + v;
						// clear
						cReg = null;

					});
					
					_attr(elem, {"class" : oldClass}, "setAttribute");
				});

			}
			return this;
		},
		/**
		 * Function 设置CLASS值
		 * 20120822
		 * @parma val[string]
		 * @tips : 重写CLASS值，区分开 addClass方法
		 */
		setClass : function ( val ) {
			
			each( this.doms, function ( index, elem ) {
			
				_attr( elem, {"class" : val}, "setAttribute" );
			
			});

			return this;
		},
		/**
		 * @function 删除CLASS值
		 * @create time : 20120817
		 * @parma val[string]
		 * @tips : 支持删除多个CLASS值，若为空，则删除全部
		 */
		delClass : function ( val ) {
			
			var oldClass,
				newQueue = val.split(' '),
				cReg;

			if ( val !== undefined ) {

				each( this.doms, function ( index, elem ) {
	
					oldClass = _attr( elem, "class", "getAttribute" );
					// not class
					if ( !oldClass ) return;
					each( newQueue, function ( k, v ) {
	
						cReg = new RegExp( '\\b'+v+'\\b', 'ig' );
						oldClass = oldClass.replace( cReg, '' );
						// clear
						cReg = null;
	
					});
	
					_attr( elem, {"class" : oldClass}, "setAttribute" );
	
				});

			} else {
				// delete all class
				each( this.doms, function ( index, elem ) {
					
					_attr( elem, {"class" : !!0}, "removeAttribute" );
					
				});
				
			}
			
			return this;
		}
	}
})());
/**
 * NameSpace 关于DOM节点操作
 * 20110930
 * .load
 * .contains
 * .create
 */
C.Dom = {
	/**
	 * Function DOM节点解析完后回调，代替window.onload
	 * @param {function} callback
	 * create data : 20120824
	 * refer : jquery 1.7.2
	 */
	load : function ( callback ) {
		
		var realType = C.DIFF.doi,
		
			realFn = function () {

				if ( document.addEventListener || document.attachEvent && document.readyState == "complete" ) {

					C.Event.un( document, realType )
					callback && callback();

				}

			};
		// Handle it asynchronously to allow scripts the opportunity to delay ready
		if ( document.readyState == "complete" ) return setTimeout( realFn, 1 );
		C.Event.on( document, realType, realFn );

	},
	
	/**
	 * Function contains 判断一元素是否包含另一元素
	 * @param {dom} parent 祖节点
	 * @param {dom} son 子节点
	 * 20120807
	 */
	contains : function ( parent, son ) {

		return parent.contains ? 

			parent != son && parent.contains( son )
		:
			!!(parent.compareDocumentPosition( son ) & 16);
	},
	
	/**
	 * Function 新建DOM节点，并设置属性
	 * @parma node{string}
	 * @parma attrs{object|null}
	 * 20111002
	 */
	create : function( node, attrs ) {

		var elem = document.createElement( node );
		elem && attrs && $D( [elem] ).setAttr( attrs );
		return elem;

	},
	
	html : function () {
		
		
		
	},
	
	text : function () {
		
		
		
	}
}

/**
 * NameSpace 延迟操作
 * 20120620
 * .dom
 * .src
 * .include
 */
C.lazy = (function () {

	var _rTag = /^body|html$/i,
		// handle of loaded css path
		_loadedCssFile = [],
		// handle of loaded script path
		_loadedScriptFile = [],
		
		_loadedFile = [];

	function _getOft( e ) {
		var t = 0;
		if ( e ) {
			
			if ( parent === window ) {
				
				while( !_rTag.test(e.tagName) ){
	
					t += e.offsetTop;
					e = e.offsetParent
				}
			} else {
				
				while( e !== parent && !_rTag.test(e.tagName) ){

					t += e.offsetTop;
					e = e.offsetParent
				}
			}
		}
		return t
	}
	
	return {
		/**
		 * Function : dom 节点延时处理，处理条件是节点出现在显示屏区域
		 * param {object dom} conf.elem 处理节点
		 * param [string] conf.scroller 滚动容器，默认为window
		 * param [function] conf.callback 回调
		 * 20120620
		 */
		dom : function ( conf ) {

			if ( !conf.elem ) return log( 'conf.elem does not exist!!' );

			var parent = conf.scroller || window;
			// check scroller is exist
			//if ( !parent ) return log( 'can\'t find element with id '+conf.scroller )
			var CB = function () {

				var oft  = _getOft( conf.elem ),
					page = C.page.info(parent);

				if ( page.ST < oft + conf.elem.clientHeight && page.WH + page.ST > oft ) {

					conf.callback && conf.callback.call( conf.elem );
					$D( parent )
						.un( 'scroll', CB )
						.un( 'resize', CB );
				}

			};
			$D( parent )
				.on( 'scroll', CB )
				.on( 'resize', CB );

			CB();
		},
		/**
		 * Function : src 延时加载带_src属性的图片或者iframe，C.lazy.dom方法的扩展
		 * create time : 20120626
		 * param [scroller] string 滚动容器，默认为 document
		 * How to use : (1) add attribute '_src' for images and store the real url in it
		 * 				(2) store the default url in attribute 'src'
		 * @callback {function}
		 */
		src : function ( scroller ) {
			
			function LazySrc ( scroller ) {
				
				this.lists = [];
				this.scroller = scroller;
				if ( !this.scroller ) return log( 'Can\'t find the scroller.' );
				
				var imgtags = this.scroller.getElementsByTagName('img'),
					imglen = imgtags.length,
					ifmtags = this.scroller.getElementsByTagName('iframe'),
					ifmlen = ifmtags.length,
					i = 0,
					_src = '';
				// collect lazy img tag
				for( ; i < imglen; i++ ) {
					_src = $D( imgtags[i] ).getAttr('_src')
					_src && this.lists.push([imgtags[i], _src]);
				}
				// collect lazy iframe tag
				for( ; i < ifmlen; i++ ) {
					_src = $D( ifmtags[i] ).getAttr('_src')
					_src && this.lists.push([ifmtags[i], _src]);
				}
					
				return this.init()
			}
			LazySrc.prototype.init = function () {
				
				var ts = this,
					lists = this.lists.slice(0),
					len = lists.length,
					scroller = this.scroller,
					oft,
					page;
				//console.log( lists )
				function doi () {
					// get element info, include ST, WH..
					page = C.page.info( scroller );
					each( lists,
						function( key, val ) {
							if ( val ) {
								// get element offsetTop value
								oft = _getOft( val[0] );
								// check is fit to load
								if ( page.ST < oft + val[0].clientHeight && page.WH + page.ST > oft ) {
									
									val[0].src = val[1];
									val[0].removeAttribute( '_src', !1 );
									delete lists[ key ];
									len--
								}
								// clean when lists is empty
								if ( !len ) {
									$D( scroller )
										.un( 'scroll', doi )
										.un( 'resize', doi );
									delete ts.list;
									delete ts.scroller;
								}
							}
						})
				}
				// add event listener when len != 0
				if ( len ) {
					doi()
					$D( scroller )
						.on( 'scroll', doi )
						.on( 'resize', doi );
				}
			}

			return new LazySrc( scroller || D )
		},
		/**
		 * css,js加载器
		 * 支持同步，异步方式加载
		 * @param[String] path 公共路径
		 * @param{Array} file 需要加载的css,js
		 * @param[Function] callback 回调
		 * @param[boolean] isAsync 是否异步加载，默认同步加载
		 * 20130322
		 */
		include : (function () {

			var rCss = /\.css(?:\?|$)/i,
			
				Cache = {},
				
				Status = ["", "Building", "Loading", "Complete"];

			/* status:
			 * 1 -> initialize
			 * 2 -> loading
			 * 3 -> complete
			 */
			function _file (index) {

				this.index  = index;
				// initialize file
				this.status = 1;
				// triggle callback list
				this.Events = [];

			}
			_file.realCallback = function (index, callbacks) {
				
				// complete
				Cache[index].status = 3;
				// triggle callbacks
				for ( var i = 0, len = callbacks.length; i < len; i++ ) {
					
					callbacks[i](index);
					
				}

			}
			_file.prototype.load = function () {
				
				var node,
					create = C.Dom.create,
					ts = this,
					cssHandle;
				
				// loading
				this.status = 2;
				
				if ( rCss.test(this.index) ) {

					node = create("link", {
						rel : "stylesheet",
						href: ts.index
					});
					
					// loading style
					var realCallback = function () {
							//IE 下，无论成功失败，都会触发 onload
							if ( C.Browser.ie && !node.styleSheet.rules.length ) return;
					
							if ( cssHandle ) {
								clearInterval( cssHandle );
								cssHandle = null
							}
							_file.realCallback(ts.index, ts.Events);

						}
	
					if ( C.Browser.render === "webkit" ) {
						cssHandle = setInterval(function () {
							if ( node['sheet'] ) {
								var rules = node['sheet'].cssRules;
								try {
									rules && rules.length && realCallback()
								} catch( e ) {
									e.code === 1000 && realCallback()
								}
							}
						}, 13)
					} else node.onload = realCallback;
					
				} else {
					
					node = create("script", {
						async : true,
						src   : ts.index
					});
					
					// Loading Script
					node.onload = node.onerror = node.onreadystatechange = function () {

						if (/loaded|complete|undefined/.test(node.readyState)) {
	
							// Ensure only run once and handle memory leak in IE
							node.onload = node.onerror = node.onreadystatechange = null;
							// Remove the script to reduce memory leak
							dHead.removeChild(node);
							// Dereference the node
							node = undefined;
							//callback(index);
							_file.realCallback(ts.index, ts.Events);
	
						}
	
					}

				}
				
				dHead.appendChild(node);
				
				return this
				
			}
			// 同步加载
			function _sync ( files, callback ) {
				
				//_loadedFile
				var len = files.length,
					done = function ( index ) {
						!--len && callback && callback();
					},
					isCache;

				each ( files, function ( k, item ) {
					
					// if object has been cache
					if ( !!(isCache=Cache[item]) ) {
						// if status is complete
						isCache.status == 3 ?
							done( item )
						:
							isCache.Events.push( done );

					} else (Cache[item] = new _file(item)).load().Events.push(done);
					
				});

			}
			// 异步加载
			function _async( files, callback ) {
					
				if ( !!files.length ) {
				
					var item = files.shift(),
						isCache = Cache[item];
					
					if ( !!isCache ) {
						
						isCache.status == 3 ?
							_async( files, callback )
						:
							isCache.Events.push(
								function () {
									_async( files, callback );
								}
							);
						
					} else (Cache[item] = new _file(item)).load().Events.push(function () { _async( files, callback ); });
					
				} else callback && callback();

			};
			
			return function ( path, files, callback, isAsync ) {
					// check isAsync
				var _isAsync = "boolean" === typeof (_isAsync = arguments[arguments.length-1]) ? _isAsync : !!0,
					_files,
					_callback;

				// check is exsit callback
				function _isExsitCallback ( fn ) {
					
					if ( "function" !== typeof (_callback=fn) ) _callback = undefined;
					
				}
				// check is exsit Path
				if ( "string" === typeof path && !!path ) {

					var len = files.length;
					if ( C.Util.isArray(files) && !!len ) {

						while ( len-- ) files[len] = path+files[len];
						_files = files;
						_isExsitCallback( arguments[2] );
						
					} else return;
	
				} else {
					
					_files = path;
					_isExsitCallback( arguments[1] );
					
				}

				!_isAsync ? _sync( _files, _callback ) : _async( _files, _callback );

			}

		})()
	}

})();

/**
 * NameSpace 请求操作
 * .ajax
 * .jsonp
 * .getHTML
 * .getJSON
 * .getXML
 * 20130211
 */

C.request = {
	/**
	 * Function 异步请求
	 * 20110612
	 * @param {string} url 请求文件
	 * @param {string} options.type 返回数据类型
	 * @param {string} options.method 请求方式
	 * @param {boolean} options.cache 是否支持缓存
	 * @param {string} options.dat 发送数据包 (add in 20111115)
	 * @param {function} options.done 请求成功回调函数
	 * @param {function} options.err 请求失败回调函数
	 * How to use :
		C.request.ajax('dat.json', {
			type : 'json',
			method : 'GET',
			cache : !1,
			err : function() {
				
				throw 'unknow type error'
			},
			done : function( dat ) {
				
				alert( dat.username )
			}
		});
		C.request.getHTML('dat.html', function( d ){ do something });
		C.request.getJSON('dat.json', function( d ){ do something });
		C.request.getXML('dat.xml', function( d ){ do something });
	
	 * @fix : 更换空间名，更改架构，使用方式有所改变 - 20120904
	 */
	ajax : function ( url, options ) {
		// check url is legal
		if ( !url || typeof url != 'string' ) return log( 'Wrong URL.' );
		// new XMLHttpRequest
		var xhr = null;
		
		if ( window.XMLHttpRequest ) {
	
			xhr = new XMLHttpRequest()
		} else {
	
			try {
				xhr = new ActiveXObject( 'Msxml2.XMLHTTP' )
			}
			catch( e ) {
				try{
					xhr = new ActiveXObject( 'Microsoft.XMLHTTP' )
				} catch( e ) {}
			}
			
		}
		if ( !xhr ) return log( "can't new a XMLHttpRequest object." )
		
		var method = (options.method || 'GET').toUpperCase(),
			cache  = options.cache || !1,
			sendDat   = '',
			onErr  = options.err;
			
		function data( X, t ){
			var ct = X.getResponseHeader( 'content-type' ),
				d = !t && ct && ct.indexOf( 'xml' ) >= 0;
			d = t === 'xml' || d ? X.responseXML : X.responseText;
			if( t === 'json' )
				d = window.eval('('+d+');');
			return d
		}
		if ( options.dat && "[object Object]" == toString.call(options.dat) ) {
			each( options.dat,
				function( key, val ){
					sendDat += key +'='+ val +'&'
				})
		}
		if ( method === 'GET' ) {
			
			url += url.indexOf( '?' ) >= 0 ? '&' : '?' + sendDat;
			sendDat = null
		}
		// 读取缓存
		!cache && ( url += 'f'+ (+new Date()) +'=do' );
		
		xhr.open( method, url, true );
		// 在open之后再进行http请求头设定 
		if (method === 'POST') {
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
		}
		//setTimeout(function(){ aborted = true }, timeout);
		xhr.onreadystatechange = function(){

			if( xhr.readyState == 4 ){
				// 在请求时，如果网络中断，Firefox会无法取得status
				// come from baidu's tangram
				try {
					
					var stat = xhr.status
				} catch(e) {
					
					log( 'Unknow Error!' )
					return
				}
				//alert( stat );
				// IE error sometimes returns 1223 when it 
				// should be 204, so treat it as success
				// come from baidu's tangram
				//log( stat )
				( (stat >= 200 && stat < 300) || stat == 304 || stat == 1223 ) && options.done( data( xhr, options.type ) );

				stat == 404 &&
				(
					onErr ?
						onErr( stat )
					:
						log( 'Not Found The File!' )
				)
				/*( stat == 404 && onErr ) ?
					onErr( 'Not Found The File!' )
				:
					log( 'Not Found The File!' );*/
				// come from baidu's tangram
				setTimeout(
					function(){
						
						xhr.onreadystatechange = new Function();
						xhr = null
					}, 0)
			}
		}
		xhr.send( sendDat )
	},
	/**
	 * jsonp package -- use for ajax request data with padding
	 * Copyright (c) desidn by cxy
	 * Version 1.0
	 * Create time : 2011-09-05 17:08
	 * How to use :
	 *
	 * C.jsonp('http://class4cxy.sinaapp.com/jsonp.php', function( d ){alert( d.sex )})
	 *@fix : 更换命名空间 - 20120904
	*/
	jsonp : function ( url, callback, dat ) {
		var fn = 'jsonp' + (+new Date()),
		
			cleaned = !1,

			js = C.dom.create( 'script', {
				type : 'text/javascript',
				charset : 'utf-8'
			});

		url = url + ( url.indexOf('?') >= 0 ? '&callback=' + fn : '?callback=' + fn );
		
		dat && each( dat,
			
			function ( key, val ) {
				
				url += '&'+ key +'='+ val;
			})
		
		js.src = url;
		function clean() {
			try{
				delete window[ fn ];
				js.parentNode.removeChild( js );
				js = null
			}catch(e){}
			cleaned = !0
		}
		window[ fn ] = function(){
			clean();
			callback.apply( this, arguments )
		}
		js.onload = js.onreadystatechange = function(){			//For IE

			var rs = this.readyState;
			!cleaned && (!rs || rs === 'loaded' || rs === 'complete') && clean()
		}
		dHead.appendChild( js )
	},
	getJSON : function ( url, callback, cache ) {
		C.request.ajax( url, {
			type  : "json",
			cache : cache,
			done  : function( dat ) {
				callback( dat )
			}
		})
	},
	getXML : function ( url, callback, cache ) {
		C.request.ajax( url, {
			type  : "xml",
			cache : cache,
			done  : function( dat ) {
				callback( dat )
			}
		})
	},
	getHTML : function ( url, callback, cache ) {
		C.request.ajax( url, {
			type  : "html",
			cache : cache,
			done  : function( dat ) {
				callback( dat )
			}
		})
	},
	post : function ( url, callback, data, cache ) {
		C.request.ajax( url, {
			type  : "json",
			cache : cache,
			method: "POST",
			dat   : data,
			done  : function( dat ) {
				callback( dat )
			}
		})
	}
	
}

/**
 * Tmpl 前端模版引擎
 * @param {String} orgTmplFile 模板代码
 * 语义 : 数据    - {@name}
 *       执行语句 - {$ if(a,b) alert("d"); $}
 *       注释符   - //
 * Demo - C.TmplM(TmplFile).get(index).render(dat)
 * .get
 * .render
 */
C.TmplM = (function () {

	var cache,
		current;

	var // 匹配变量
		rVar = /\{@([^\}]+)\}/g,
		// 匹配转意符
		rClean = /\\(\{|\})/g,
		// 匹配script语句
		rScript = /\{\$(.*?)\$\}/,
		// 匹配注释代码
		rNode = /(\s*)\/{2,}/,
		// 匹配 行
		rline = /(\s*)([^\r\n]+)/g,
		// 解析tmpl文件
		rParseTmp = /(\/\/BEGIN\/\/)\{([\w]+)\}([^\1]*?)\/\/END\/\//g;

	// 编译模块
	function _compile ( tmpl ) {
		
		var script;

		return tmpl.replace( rline, function (a, b, c) {
					
					// 存在注释符
					if ( rNode.test(c) ) return b+c;

					// 不属于空行
					if ( !!c ) {
						// 注释代码
						//console.log(d)
						//if ( !!c ) return "";
						// 匹配到JS语句
						if ( !!(script=rScript.exec(c)) ) {
							
							return b + script[1] + "\n";
							
						} else return b +"_s += '"+ c.replace( rVar, "'+($1)+'" ) +"';\n";
						
					} else return "";
				});
		
	}
	
	// 恶意代码转换模块
	var _encode = (function () {
		
		var badChars = /&(?!\w+;)|[<>"']/g,
			map = {
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#x27;",
				"&": "&amp;"
			},
			fn = function (s) {
				return map[s] || s;
			}
		return function (content) {
			return typeof content === 'string' ?
				content.replace(badChars, fn)
			:
				content;
		};
	})();
	
	return (cache = function ( orgTmplFile ) {
		
		if ( !cache.initialize ) {
			
			var self = arguments.callee;

			// 获取模板
			self.get = function ( index ) {
			
				var index = "__"+index,
					item = self[index];
				
				if ( !!item ) {
					
					// 模板还没被编译
					if ( !!item.tmpl ) {
						// 保存编译好的模板
						item.parseTmpl = "var _s = ''; "+ _compile( item.tmpl ) +" return _s;";
						delete item.tmpl
						
					}
					
					current = index;
					
				} else current = "";
				
				return self;
			
			};

			// 合成HTML
			self.render = function ( map ) {

				if ( !!map && (!C.Util.isEmptyObject(map) || !!map.length) && !!current ) {

					return new Function( 'O, encode', cache[current].parseTmpl )( map, _encode )
					
				}
				return ""

			};

			cache.initialize = !!1
			
		}

		orgTmplFile.replace( rParseTmp, function ( a, b, c, d ) {
		
			// 索引前默认增加额外字符，防止索引与Function自身的属性冲突
			var index = "__";
			if ( !!c && !!d.replace(/[\s]*/g, "") && !cache[ index += c ] ) {
				
				cache[index] = {};
				cache[index].tmpl = d;
				
			}
		
		});
		
		return cache;

	})

})();

// Expose
window.C = C;

})( undefined );
