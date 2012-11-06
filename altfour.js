;!function()
{
    var root = this;
    
    var namespace = 'altfourjs';
    
    var Cache = function()
    {
        var self = this;

        this.garbageCollectors = {};

        /**
         * Runs GC process
         */
        this.cleanup = function(key)
        {
            delete this.storage[key];
        };

        /**
         * Registers key for removal
         * @var string
         */
        this.registerGc = function(key, expiry)
        {
            var self = this;
            this.garbageCollectors[key] = setTimeout(function()
            {
                self.cleanup.apply(self, [key]);
            }, expiry);
        };

        /**
         * Deregister GC
         * @var string
         */
        this.deregisterGc = function(key)
        {
            clearTimeout(this.garbageCollectors[key]);
            this.garbageCollectors[key] = null;
        };

        /**
         * Verifies support for local storage
         */
        this.hasLocalStorage = function()
        {
            var uid;
            var storage;
            var result;
            uid = new Date();
            try
            {
                (storage = window.localStorage).setItem(uid, uid);
                result = storage.getItem(uid) == uid;
                storage.removeItem(uid);
                return result && storage;
            }
            catch(e)
            {
                return false;
            }
        };

        /**
         * Saves the cache to local storage
         */
        this.saveToLocalStorage = function()
        {
            if (this.hasLocalStorage())
            {
                localStorage.setItem(namespace, JSON.stringify(this.storage));
            }
        };

        /**
         * Retrieves the cache from local storage
         */
        this.retrieveFromLocalStorage = function()
        {
            if (this.hasLocalStorage())
            {
                this.storage = JSON.parse(localStorage.getItem(namespace));
            }
            else
            {
                this.storage = null;
            }
        };
        
        // Is local storage supported? Retrieve the object
        this.retrieveFromLocalStorage();

        if (!this.storage)
        {
            this.storage = {};
        }
    };

    Cache.prototype = {
        /**
         * Adds item with key and expiry time
         */
        add : function(key, item, expiry)
        {
            if (expiry)
            {
                expiry = new Date().getTime() + expiry;
                
                // Register key for expiry
                this.registerGc(key, expiry);
            }
            else
            {
                expiry = 0;
                
                // Removes potential GC
                this.deregisterGc(key);
            }

            this.storage[key] = {
                item   : item,
                expiry : expiry
            };

            // Save to local storage
            this.saveToLocalStorage();
            
            return this;
        },
        /**
         * Retrieves an object
         */
        get : function(key, callback)
        {
            var item;
            var now;
            now = new Date().getTime();
            // Does the key exist?
            if (this.storage[key])
            {
                item = this.storage[key];
                // Is the item valid?
                if (!item.expiry || (item.expiry && item.expiry >= now))
                {
                    return item.item;
                }
                // Remove the item
                else if (item.expiry && item.expiry < now)
                {
                    this.storage[key] = null;
                    
                    // Save to local storage
                    this.saveToLocalStorage();
                }
            }
            // If not found, but callback defined, the value will be retrieved
            else if (callback)
            {
                var value;
                value = callback(key, this);
                
                // Function might return void (i.e. asynchronous calls)
                if (value !== undefined)
                {
                    // Add the key with no expiry date
                    this.add(key, value, 0);
                    return this.get(key);
                }
            }

            // In any other case, return undefined
            return undefined;
        },
        /**
         * Empties the cache
         */
        clear : function()
        {
            this.storage = {};
            this.saveToLocalStorage();
            return this;
        }
    };
    
    root.Cache = root.Cache || Cache;

}();