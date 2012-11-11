# altfourjs
A simple caching library for objects.

If supported, it utilizes the local storage API.

# Usage
    var cache = new Cache();

    cache.add(1, "one", 0); // Add object that doesn't expires
    cache.add(2, "two", 1); // Add object that expires in one second

    cache.get("two"); // Retrieve object with key "two"

    cache.clear(); // Clear the cache
    
    // Provide callback to run on cache miss
    cache.get("name", function(key, cache)
    {
        return "John Doe";
    });
    
    // Assume value set asynchronously if no return value
    cache.get("age", function(key, cache)
    {
        cache.set(key, 24);
    });
    
    // Remove an item
    cache.remove("age");
    
# Changelog
## 2012-11-11
Adds function to remove an item

## 2012-11-06
Adds garbage collector

## 2012-11-05
Adds support for callback function on cache miss