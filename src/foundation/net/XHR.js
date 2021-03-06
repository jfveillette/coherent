/*jsl:import ../core/base.js*/
/*jsl:declare XHR*/
/*jsl:declare XMLHttpRequest*/
/*jsl:declare ActiveXObject*/

/** @name XHR
    @namespace
 */
(function(){

  function noop()
  {}

  /** Retrieve an XMLHttpRequest object for each browser.
      @name getTransport
      @function
      @type XMLHttpRequest
   */

  var getTransport= function()
            {
              throw new Error('XMLHttpRequest not available.');
            };
  
  //  Everything but IE gets the native XMLHttpRequest
  if ('undefined'!==typeof(window.XMLHttpRequest))
    getTransport= function ()
    {
      return new XMLHttpRequest();
    };
  else
  {
    //  Hereafter, everything is IE related
    var progIdCandidates= ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
    var len= progIdCandidates.length;

    var progId;
    var xhr;
    
    for (var i=0; i<len; ++i)
    {
      try
      {
        progId= progIdCandidates[i];
        xhr= new ActiveXObject(progId);
        //  ActiveXObject constructor throws an exception
        //  if the component isn't available.
        getTransport= function()
        {
          return new ActiveXObject(progId);
        };
        break;
      }
      catch (e)
      {
        //  Ignore the error
      }
    }
  }

  var jsonpIndex= 0;
  
  /** Send a XHR request.
      @inner
      @param {String} url - The URL of the endpoint
      @param {String} method - The HTTP method to use
      @param {Object} options - Options...
      @type coherent.Deferred
   */
  function send(url, method, options)
  {
    var timeout;
    
    function timeoutExpired()
    {
      cancel();
      var err= new Error('XHR request timed out');
      err.url= url;
      err.method= method;
      deferred.failure(err);
    }
    
    function cancel()
    {
      if (timeout)
        window.clearTimeout(timeout);
      xhr.onreadystatechange= noop;
      xhr.abort();
      XHR.numberOfActiveRequests--;
    }

    function sendViaJsonP(url)
    {
			var head = document.getElementsByTagName("head")[0] || document.documentElement;
			var script = document.createElement("script");
			var done= false;
			
      var jsonpParam= 'string'===typeof(options.jsonp) ? options.jsonp : 'callback';
      var jsonpFnName= 'jsonp'+(++jsonpIndex);
      var undefined;

      if (-1===url.indexOf('?'))
        url+= '?';
      else if ('&'!==url.slice(-1))
        url+= '&';
      url+= jsonpParam + '=' + jsonpFnName;
      
			script.src = url;
      
      window[jsonpFnName]= function(data)
      {
        if (deferred)
          deferred.callback(data);
				
				window[jsonpFnName]= undefined;

				try
				{
					delete window[jsonpFnName];
				}
				catch (err)
				{}
				
				if (head && script)
					head.removeChild(script);
      }
      
			// Attach handlers for all browsers
			script.onload = script.onreadystatechange = function()
    			{
    			  if (done || (this.readyState && this.readyState!=='loaded' && this.readyState!=='complete'))
    			    return;

  					done = true;

  					// Handle memory leak in IE
  					script.onload = script.onreadystatechange = null;
  					if (head && script.parentNode)
  						head.removeChild(script);
    			};

			// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
			// This arises when a base node is used (#2709 and #4378).
			head.insertBefore(script, head.firstChild);
			
			return deferred;
		}

    function readyStateChanged()
    {
      if (4!==xhr.readyState)
        return;

      if (timeout)
        window.clearTimeout(timeout);
      
      if (!xhrSent)
      {
        arguments.callee.delay(0);
        return;
      }
      
      var status= xhr.status;
      var succeeded= (status>=200 && status<300) || 304==status;

      if (0===status || 'undefined'===typeof(status))
      {
        var protocol= window.location.protocol;
        succeeded= 'file:'===protocol || 'chrome:'===protocol;
      }
      
      var result= xhr.responseText;
      var err;
      
      if (succeeded)
      {
        if ('HEAD'==method) {
          result= {};
          try {
            var headers= xhr.getAllResponseHeaders();
            if (headers) {
              headers= headers.split("\n");
              headers.forEach(function(header) {
                var match= header.match(/^([^:]+):(.+)$/m);
                var name= match[1].trim();
                result[name]= match[2].trim();
              });
            }
          } catch(e) {}
        } else {
          var contentType= options.responseContentType||
                   xhr.getResponseHeader("Content-Type");
          
          // Response is JSON
          if (contentType.match(/(?:application\/(?:x-)?json)|(?:text\/json)/)) {
            try
            {
              if (""!==result)
                result= coherent.globalEval('('+result+')');
              else
                result= null;
            }
            catch (e)
            {
              err= e;
              succeeded= false;
            }
          }
          // Response is XML
          if (contentType.match(/(?:application|text)\/xml/)) {
            result = xhr.responseXML;
          }
        }
      }
      else
      {
        err= new Error('XHR request failed');
        err.url= url;
        err.method= method;
        err.xhr= xhr;
        err.status= xhr.status;
        err.statusText= xhr.statusText;
        err.body= body;
      }
      
      if (succeeded)
        deferred.callback(result);
      else
        deferred.failure(err);
      
      xhr.onreadystatechange= noop;
      xhr= null;
      XHR.numberOfActiveRequests--;
    }
    
    var queryString= Object.toQueryString(options.parameters||{});
    var body= options.body||"";
    var async= !options.sync;
    var deferred= new coherent.Deferred(cancel);
    var xhrSent = false;
    
    //  default values
    method= (method||'GET').toUpperCase();

    if (!body && ('POST'===method || 'PUT'===method))
    {
      body= queryString;
      queryString= "";
    }

    if ('GET'===method && !options.allowCache)
    {
      var cache_bust= "__cache_buster=" + (new Date()).getTime();
      queryString= queryString?(queryString + "&" + cache_bust):cache_bust;
    }

    if (queryString)
    {
      var join= '';
      
      if (-1===url.indexOf('?'))
        join= '?';
      else if ('&'!==url.slice(-1))
        join= '&';

      url= [url, queryString].join(join);
    }

    if (options.jsonp)
      return sendViaJsonP(url);

    var xhr= getTransport();

    if (options.responseContentType && xhr.overrideMimeType)
      xhr.overrideMimeType(options.responseContentType);

    if (async)
      timeout= timeoutExpired.delay(options.timeout||30000);
      
    if (options.user)
      xhr.open(method, url, async, options.user, options.password||"");
    else         
      xhr.open(method, url, async);

    //  Set headers for the request
    var headers= options.headers||{};
    for (var h in headers)
      xhr.setRequestHeader(h, headers[h]);

    if ('POST'==method || 'PUT'==method)
      xhr.setRequestHeader("Content-Type", options.contentType||"application/x-www-form-urlencoded");
    
    if (async)
      xhr.onreadystatechange= readyStateChanged;
    
    xhr.send(body);
    xhrSent = true;

    if (!async)
      readyStateChanged();
      
    XHR.numberOfActiveRequests++;
    return deferred;
  }

  
  coherent.XHR= /** @lends XHR */ {
  
    numberOfActiveRequests: 0,
    
    get: function(url, parameters, options)
    {
      return XHR.request('GET', url, parameters, options);
    },
  
    post: function(url, parameters, options)
    {
      return XHR.request('POST', url, parameters, options);
    },

    put: function(url, parameters, options)
    {
      return XHR.request('PUT', url, parameters, options);
    },
    
    request: function(method, url, parameters, options)
    {
      method= method.toUpperCase();
      options= options||{};
      options.parameters= parameters;
      return send(url, method, options);
    }
    
  };

  coherent.__export('XHR');
})();
