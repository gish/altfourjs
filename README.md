# altfourjs 
_– because cache is king_

A simple caching library for objects. If supported, it utilizes the local storage API.

# Usage

## Add and retrieve value
    var cache = new Cache();
    cache.add("name", "John Doe", 0);
    var name = cache.get("name");

## Remove a value
    var cache = new Cache();
    cache.add("name", "John Doe", 0);
    cache.remove("name");
    

## Add value that expires in a minute
    var cache = new Cache();
    cache.add("name", "John Doe", 60);

## Clear the cache
    var cache = new Cache();
    cache.clear();
    
## Provide callback to run on cache miss
    var cache = new Cache();
    var name = cache.get("name", function(key, cache)
    {
        return "John Doe";
    });
    
## Set value from asynchronous callback on cache miss
    var cache = new Cache();
    var name = cache.get("name", function(key, cache)
    {
        cache.set(key, "John Doe", 0);
    });
    
## Create two separate caches
    var one = new Cache('one');
    var two = new Cache('two');
    
# Chaining
The basic functions can be chained like this:

    var cache = new Cache();
    cache.add("name", "John Doe").add("age", 26).remove("name");
    cache.get("name") == undefined;
    
# Changelog
## 2012-11-12
Adds functionality to use multiple caches

## 2012-11-11
Adds function to remove an item

## 2012-11-06
Adds garbage collector

## 2012-11-05
Adds support for callback function on cache miss