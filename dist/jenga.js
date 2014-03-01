// Jenga: fuck z-indexes
// ----------------------------------
// v0.0.1
//
// Copyright (c)2014 Jason Strimpel
// Distributed under MIT license
var jenga = (function (global) {

    'use strict';

    // this will be used for addressing all the browser & version specific
    // items that impact stacking contexts
    // fixed - the version where position fixed started creating a stacking context
    var browsers = {
        chrome: {
            fixed: 22
        }
    };
    
    // get browser version and name
    // i did not write this; if someone knows who did please let me know
    // so i can attribute the code to the author
    var browser = (function () {
        var N = navigator.appName;
        var ua = navigator.userAgent;
        var tem;
        var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) {
            M[2] = tem[1];
        }
        M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
    
        return {
            name: M[0].toLowerCase(),
            version: M[1]
        };
    })();
    
    var isFixedStackingCtx = (function () {
        return browsers[browser.name].fixed >= parseInt(browser.version, 10);
    })();
    
    function isFunction(thing) {
        return typeof thing === 'function';
    }
    
    function isPosAndHasZindex(el) {
        return el.style.position !== 'static' && el.style.zIndex !== 'auto';
    }
    
    // these values cause an element to create a stacking context
    function doesStyleCreateStackingCtx(el) {
        var styles = el.style;
    
        if (styles.opacity < 1) {
            return true;
        }
        if (styles.transform !== 'none') {
            return true;
        }
        if (styles.transformStyle === 'preserve-3d') {
            return true;
        }
        if (styles.perspective !== 'none') {
            return true;
        }
        if (styles.flowFrom !== 'none' && styles.content !== 'normal') {
            return true;
        }
        if (styles.position === 'fixed' && isFixedStackingCtx) {
            return true;
        }
    
        return false;
    }
    
    function modifyZindex(el, increment) {
        var stackingCtxEl = jenga.getStackingCtx(el);
        var siblings = stackingCtxEl.childNodes;
        var siblingsMaxMinZindex = increment ? 0 : -1;
    
        var siblingZindex;
    
        for (var i = 0; i < siblings.length; i++) {
            if (siblings[i].nodeType === 1 && isPosAndHasZindex(siblings[i]) && siblings[i] !== el) {
                siblingZindex = parseInt(siblings[i].style.zIndex, 10);
                if (isNaN(siblingZindex)) {
                    continue;
                }
    
                if (increment) {
                    siblingsMaxMinZindex = siblingZindex > siblingsMaxMinZindex ?
                        siblingZindex : siblingsMaxMinZindex;
                } else {
                    siblingsMaxMinZindex = siblingsMaxMinZindex < 0 || siblingZindex < siblingsMaxMinZindex ?
                        siblingZindex : siblingsMaxMinZindex;
                }
            }
        }
    
        // adjusted z-index is 0 and sending to back then bump all other elements up by 1
        if (!siblingsMaxMinZindex && !increment) {
            for (i = 0; i < siblings.length; i++) {
                if (siblings[i].nodeType === 1 && siblings[i] !== el) {
                    siblingZindex = parseInt(siblings[i].style.zIndex, 10);
                    if (isNaN(siblingZindex)) {
                        continue;
                    }
    
                    siblings[i].style.zIndex = ++siblingZindex;
                }
            }
        }
    
        el.style.zIndex = increment ? siblingsMaxMinZindex + 1 : (siblingsMaxMinZindex ? siblingsMaxMinZindex - 1 : 0);
    }
    
    function moveUpDown(el, createStackingCtx, root, increment) {
        var stackingCtxEl = jenga.getStackingCtx(el);
    
        if (createStackingCtx && stackingCtxEl !== el.parentNode) {
            if (isFunction(createStackingCtx)) {
                createStackingCtx(el.parentNode);
            } else {
                el.parentNode.style.position = 'relative';
                el.parentNode.style.zIndex = 0;
            }
        }
    
        modifyZindex(el, increment);
        if (root && (root !== jenga.getStackingCtx(el) && stackingCtxEl.tageName !== 'HTML')) {
            moveUpDown(stackingCtxEl, createStackingCtx, root, increment);
        }
    }
    
    var jenga = {
    
        isStackingCtx: function (el) {
            return el.tagName === 'HTML' || (isPosAndHasZindex(el) && doesStyleCreateStackingCtx(el));
        },
    
        getStackingCtx: function (el) {
            var parentNode = el.parentNode;
    
            while (!jenga.isStackingCtx(parentNode)) {
                parentNode = parentNode.parentNode;
            }
    
            return parentNode;
        },
    
        bringToFront: function (el, createStackingCtx, root) {
            moveUpDown(el, createStackingCtx, root, true);
        },
    
        sendToBack: function (el, createStackingCtx, root) {
            moveUpDown(el, createStackingCtx, root, false);
        }
    };

    return jenga;

})(this);