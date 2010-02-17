/*jsl:import startup.js*/


/** The base class for all transformers.

    Some predefined transformers include:
    
    - {@link coherent.transformer.Not} `not` - A transformer that reverses the
        logical value. This applies to truthy and falsy values as well.
    - {@link coherent.transformer.Truncated} `truncated` - A transformer that
        will shorten a string longer than 50 characters.
    - {@link coherent.transformer.StringsToObjects} `StringsToObjects` - A
        transformer that will convert an array of strings into an array of
        objects with each object having a key `string`.
    - {@link coherent.transformer.Trimmed} `trim` - A transformer that will
        remove the spaces at the beginning and end of a string.
 */
coherent.ValueTransformer = Class.create({

    /** Create a new ValueTransformer. If only one argument is passed, and it's
        an object, this method will copy all the properties of the argument to
        this transformer.
     */
    constructor: function()
    {
        if (arguments.length==1 && 'object'===typeof(arguments[0]))
            Object.extend(this, arguments[0]);
    },
    
    /** Transform a model value into a presentational value.
    
        @param value - The model value.
        @return The presentation value.
     */
    transformedValue: function(value)
    {
        return value;
    },

    /** Convert a presentation value back into a model value.
    
        Note: Unless a subclass specifically overrides this method it will
        get removed by the subclass hook ({@link coherent.ValueTransformer.__subclassCreated__}).
        
        @param value - The presentation value
        @returns The model value
     */
    reverseTransformedValue: function(value)
    {
        return value;
    },

    /** Allow factory creation of transformers.
        @returns {Function} A factory method that will instantiate a new
                 transformer instance with the arguments passed to the constructor.
     */
    __factory__: function()
    {
        var args= Array.from(arguments);
        var klass= this;
        
        function dummyConstructor(){}
        
        return function()
        {
            dummyConstructor.prototype= klass.prototype;
            var obj= new dummyConstructor();
            klass.prototype.constructor.apply(obj, args);
            return obj;
        };
    }
    
});

/** Capture creation of subclasses of ValueTransformer. Mask the
    {@link coherent.ValueTransformer#reverseTransformedValue} method if not
    overridden in a subclass. This enables the detection of whether the
    Transformer _really_ supports reverse transformation, while at the same
    time, clearly documenting the API for reverseTransformedValue.
    
    @param {Class} subclass - The new subclass of coherent.ValueTransformer
 */
coherent.ValueTransformer.__subclassCreated__= function(subclass)
{
    var rootproto= coherent.ValueTransformer.prototype;
    var proto= subclass.prototype;
    
    /*  @JEFF: I think this may be a bit dangerous, because if someone were just
        inspecting the code, he might be confused about why
        reverseTransformedValue wasn't executing...
     */
    if (rootproto.reverseTransformedValue == proto.reverseTransformedValue)
        subclass.prototype.reverseTransformedValue = null;
}

/** @namespace
    This is where all the ValueTransformer classes are registered.
 */
coherent.transformer= {};

/** @namespace
    This is where all the registered instances of ValueTransformers live.
 */
coherent.transformerInstances= {};

/** Lookup a ValueTransformer instance by name.
    
    @param {String} transformerName - The name of the value transformer
    @returns {coherent.ValueTransformer} a reference to the specifed value transformer
    @throws {InvalidArgumentError} If the transformerName does not specify
            a pre-registered value transformer
 */
coherent.findTransformerWithName= function(transformerName)
{
    var valueTransformer= coherent.transformerInstances[transformerName.toLowerCase()];
    if (valueTransformer)
        return valueTransformer;

    //  Try to create an instance of the transformer assuming the transformerName
    //  value is a class name
    if (-1===transformerName.indexOf('.'))
        valueTransformer= coherent.transformer[transformerName];
    
    //  If there were dots in the name or the undotted name wasn't found, try to
    //  evaluate the string to see if it resolves to an instance, constructor, or
    //  finally a factory function.    
    if (!valueTransformer)
    {
        try
        {
            valueTransformer= eval(transformerName);
        }
        catch(e)
        {}
    }
    
    if (!valueTransformer)
        throw new InvalidArgumentError("The transformerName argument does not specify a valid ValueTransformer: " +
                                       transformerName);

    //  If the valueTransformer isn't a function, just return it
    if ('function'!==typeof(valueTransformer))
        return valueTransformer;
        
    //  valueTransformer is now either a factory function or a constructor.
    //  Create an instance of the transformer, if you need arguments, you should
    //  probably consider using the factory function version...
    if (valueTransformer.__factoryFn__)
        valueTransformer= valueTransformer();
    else
        valueTransformer= new valueTransformer();

    return valueTransformer;
}

/** Register an instance of a ValueTransformer with a specific name.

    @param {coherent.ValueTransformer} valueTransformer - The value transformer
        instance or constructor to register.
    @param {String} name - The name by which this value transformer is known.
    
    @throws {InvalidArgumentError} if the valueTransformer parameter
            doesn't specify either a constructor or an instance of a valid
            ValueTransformer subclass.
 */
coherent.registerTransformerWithName= function(valueTransformer, name)
{
    //  make certain it really is a value transformer
    if (!valueTransformer.transformedValue)
        throw new InvalidArgumentError( "The valueTransformer argument does not support the ValueTransformer method transformedValue" );

    name= name.toLowerCase();    
    coherent.transformerInstances[name]= valueTransformer;
}




/** Simple ValueTransformer that reverses the truth value of a key
 */
coherent.transformer.Not= Class.create(coherent.ValueTransformer, {

    transformedValue: function(value)
    {
        return (value?false:true);
    },
    
    reverseTransformedValue: function(value)
    {
        return (value?false:true);
    }
    
});

coherent.registerTransformerWithName(new coherent.transformer.Not(), "not");




/** ValueTransformer that returns true only for a particular value.
 */
coherent.transformer.Boolean= Class.create(coherent.ValueTransformer, {

    constructor: function(trueValue, falseValue)
    {
        this.trueValue= trueValue;
        this.falseValue= falseValue;
    },
    
    transformedValue: function(value)
    {
        return (value==this.trueValue);
    },
    
    reverseTransformedValue: function(value)
    {
        return (value?this.trueValue:this.falseValue);
    }

});




/** ValueTransformer that returns true only for values matching a regex
 */
coherent.transformer.Matches= Class.create(coherent.ValueTransformer, {

    constructor: function(trueRegex)
    {
        this.trueRegex= trueRegex;
    },
    
    transformedValue: function(value)
    {
        return this.trueRegex.test(value);
    }

});




/** A transformer that maps between two lists of values.
 */
coherent.transformer.Generic= Class.create(coherent.ValueTransformer, {

    constructor: function(modelValues, displayValues)
    {
        this.modelValues= modelValues;
        this.displayValues= displayValues;
    },
    
    transformedValue: function(value)
    {
        var index= this.modelValues.indexOf(value);
        var novalue;
        
        if (-1==index)
            return novalue;
        else
            return this.displayValues[index];
    },
    
    reverseTransformedValue: function(value)
    {
        var index= this.displayValues.indexOf(value);
        var novalue;
        
        if (-1==index)
            return novalue;
        else
            return this.modelValues[index];
    }
    
});



/** Truncate a string value at a specific length.
    @property {Number} max - maximum length of the string value before it will
        be truncated.
 */
coherent.transformer.Truncated= Class.create(coherent.ValueTransformer, {

    constructor: function(max)
    {
        this.max= max || 50;
    },
    
    ellipsis: String.fromCharCode(0x2026),
    
    transformedValue: function(value)
    {
        if (!value && 0!==value)
            return value;

        value= "" + value;
        var len= value.length;
        if (len<=this.max)
            return value;

        //  Perform the ellipsis trick
        var half= this.max/2-2;
    
        //  Have to use Unicode character rather than entity because otherwise this
        //  won't work as a text binding.
        return [value.substr(0, half), this.ellipsis, value.substr(len-half)].join(' ');
    }
    
});

coherent.registerTransformerWithName(new coherent.transformer.Truncated(50), "truncated");




/** Convert a collection of strings into objects suitable for binding. This makes
    it easier to display an array of simple strings.
    
    @property {String} key - The key used to reflect the string value.
 */
coherent.transformer.StringToObject= Class.create(coherent.ValueTransformer, {

    constructor: function(key)
    {
        this.key= key||'string';
    },
    
    transformedValue: function(value)
    {
        if ('string'!==typeof(value))
            return value;
        var kvo= new coherent.KVO();
        kvo[this.key]= value;
        return kvo;
    },
    
    reverseTransformedValue: function(value)
    {
        return value && (this.key in value) ? value[this.key] : value;
    }
    
});
coherent.registerTransformerWithName(new coherent.transformer.StringToObject('string'), 'StringToObject');



/** Return the first object in a collection.
 */
coherent.transformer.FirstObject= Class.create(coherent.ValueTransformer, {
    transformedValue: function(array)
    {
        if ('array'!==coherent.typeOf(array))
            return array;
            
        return array[0];
    }
});


/** Return a string value that has whitespace at the beginning and end removed.
    This will also optionally compress whitespace within the value. Compressing
    the whitespace is important because whitespace is not significant in HTML
    display. By compressing it, you can recognise values that differ only via
    whitespace, but which will appear the same.
    
    @property {Boolean} compressWhitespace - Should whitespace be compressed?
 */
coherent.transformer.Trimmed= Class.create(coherent.ValueTransformer, {

    compressWhitespace: false,
    
    transformedValue: function(value)
    {
        if ('string'!==typeof(value))
            return value;
        if (this.compressWhitespace)
            return value.trim().replace(/\s+/g, ' ');
        return value.trim();
    },
    
    reverseTransformedValue: function(value)
    {
        if ('string'!==typeof(value))
            return value;
        if (this.compressWhitespace)
            return value.trim().replace(/\s+/g, ' ');
        return value.trim();
    }
    
});

coherent.registerTransformerWithName(new coherent.transformer.Trimmed(), "trim");
