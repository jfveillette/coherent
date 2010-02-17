/*jsl:import base.js*/

/** @class
    @name Array
 */
 
/** Return an array containing the distinct elements from this array.
    @type Array
 */
Array.prototype.distinct= function()
{
    var len= this.length;
    var result= new Array(len);
    var i;
    var e;
    var count= 0;
    
    for (i=0; i<len; ++i)
    {
        e= this[i];
        if (-1==result.indexOf(e))
            result[count++]= e;
    }
    //  trim to correct size
    result.length= count;
    return result;
}

/** Compare an array with another array.

    @param {Array} a - the other array
    @returns {Number} -1 if this array precedes a, 0 if the two arrays are equal,
        and 1 if this array follows a.
 */
Array.prototype.compare= function(a)
{
    var lengthDifference= this.length - a.length;
    if (0!==lengthDifference)
        return lengthDifference;
    var i;
    var len= this.length;
    var v;
    
    while (len--)
    {
        if (0!==(v=coherent.compareValues(this[len], a[len])))
            return v;
    }
    
    return 0;
}


/** Create an array from an array-like object.
    @param {Object} obj - an array-like object.
    @param {Number} [startIndex=0] - The starting index for copying values.
    @returns {Array} a new array containing all the values from the parameter.
 */
Array.from= function(obj, startIndex)
{
    return Array.prototype.slice.call(obj, startIndex||0);
}


/** Generate an array containing the values between begin and end. When called
    with only one parameter, the parameter should be an array, and IndexRange
    will return another array with each index of the array.
    
    @param {Number|Array} begin - the first value or an array
    @param {Number} [end] - the final value
    @returns {Array} an array containing numbers between begin and end.
 */
function IndexRange(begin, end)
{
    var i;
    var r=[];

    if (1==arguments.length && begin.length)
    {
        end= begin.length-1;
        begin= 0;
    }

    if (begin>end)
    {
        var tmp= end;
        end= begin;
        begin= tmp;
    }
    for (i=begin; i<=end; ++i)
        r.push(i);
    return r;
}





// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:reduce
if (!Array.prototype.reduce)
    Array.prototype.reduce = function(fun /*, initial*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value and an empty array
        if (0===len && 1===arguments.length)
            throw new TypeError();

        var i = 0;
        if (arguments.length >= 2)
            var rv = arguments[1];
        else
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);

        for (; i < len; i++)
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);

        return rv;
    }
        
// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:reduceRight    
if (!Array.prototype.reduceRight)
    Array.prototype.reduceRight = function(fun /*, initial*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value, empty array
        if (0===len && 1===arguments.length)
            throw new TypeError();

        var i = len - 1;
        if (arguments.length >= 2)
            var rv = arguments[1];
        else
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);

        for (; i >= 0; i--)
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);

        return rv;
    }

if (!Array.indexOf)
    Array.indexOf= function(array, obj, fromIndex) {
        return Array.prototype.indexOf.call(array, obj, fromIndex);
    }
if (!Array.lastIndexOf)
    Array.lastIndexOf= function(array, obj, fromIndex) {
        return Array.prototype.lastIndexOf.call(array, obj, fromIndex);
    }
if (!Array.forEach)
    Array.forEach = function(array, f, obj) {
        return Array.prototype.forEach.call(array, f, obj);
    }
if (!Array.filter)
    Array.filter= function(array, f, obj) {
        return Array.prototype.filter.call(array, f, obj);
    }
if (!Array.map)
    Array.map= function(array, f, obj) {
        return Array.prototype.map.call(array, f, obj);
    }
if (!Array.some)
    Array.some= function(array, f, obj) {
        return Array.prototype.some.call(array, f, obj);
    }
if (!Array.every)
    Array.every = function(array, f, obj) {
        return Array.prototype.every.call(array, f, obj);
    }
if (!Array.reduce)
    Array.reduce= function(array, fun /*, initial*/)
    {
        if (arguments.length>2)
            return Array.prototype.reduce.apply(array, fun, arguments[2]);
        else
            return Array.prototype.reduce.apply(array, fun);
    }
if (!Array.reduceRight)
    Array.reduceRight= function(array, fun /*, initial*/)
    {
        if (arguments.length>2)
            return Array.prototype.reduceRight.apply(array, fun, arguments[2]);
        else
            return Array.prototype.reduceRight.apply(array, fun);
    }

