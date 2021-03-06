var cache = new Cache();
test("Stored object doesn't expire", function()
{
    var object = {};
    cache.set('foo', object, 0);
    equal(cache.get('foo'), object, "Object didn't expire");
    cache.clear();
});

test("Can store string", function()
{
    var string = "foo bar";
    cache.set('string', string, 0);
    equal(cache.get('string'), string, "String in cache");
    cache.clear();
});

test("Can store int", function()
{
    var integer = 1;
    cache.set('integer', integer, 0);
    equal(cache.get('integer'), integer, "Integer in cache");
    cache.clear();
});

test("Can store array", function()
{
    var array = [];
    cache.set('array', array, 0);
    equal(cache.get('array'), array, "Array in cache");
    cache.clear();
});

test("Object expires", function()
{
    var object = {};
    cache.set('object', object, -1);
    strictEqual(cache.get('object'), undefined, "Object has expired");
    cache.clear();
});

test("Object with future date doesn't expire", function()
{
    var object = {};
    cache.set('object', object, new Date().getTime()+3600);
    equal(cache.get('object'), object, "Object is there");
    cache.clear();
});

test("Cache can be cleared", function()
{
    var foo = 1;
    var bar = 2;
    cache.set('foo', foo, 0).set('bar', bar, 0);
    cache.clear();
    strictEqual(cache.get('foo'), undefined, "Foo object is removed");
    strictEqual(cache.get('bar'), undefined, "Bar object is removed");
});

test("Has JSON", function()
{
    ok(JSON, "No JSON library");
    ok(JSON.stringify, "JSON library has stringify()");
    ok(JSON.parse, "JSON library has parse()");
});


// Local storage
test("Cache in local storage", function()
{
    var cache = new Cache();
    cache.set("foo", "foo", 1E3);
    cache.set(1, "bar", 1E3);
	cache = null;
	cache = new Cache();
    equal(localStorage.getItem('altfourjs'), JSON.stringify(cache.storage), "Cache stored in local storage");
});

// Assigns value from callback if miss
test("Item stored from callback on miss", function()
{
    var name = "John Doe";
    var key = "name";
    cache.clear();
    strictEqual(cache.get(key), undefined, "Cache doesn't contain key '" + key + "' when cleared");
    equal(cache.get(key, function(key, cache)
    {
        return name;
    }), name, "Cache contains object with key '" + key + "' after callback");
});

// No value retrieved if callback doesn't return value
test("Item not stored when callback function returns void on miss", function()
{
    var key = "name";
    cache.clear();
    strictEqual(cache.get(key), undefined, "Cache doesn't contain key '" + key + "' when cleared");
    strictEqual(cache.get(key, function() {}), undefined, "Cache doesn't contain object with key '" + key + "' after callback");
});

// Value set asynchronously by callback function
asyncTest("Value set asynchronously by callback", 2, function()
{
    var key = "name";
    var value = "John Doe";
    cache.clear();
    strictEqual(cache.get(key), undefined, "Cache doesn't contain key '" + key + "' when cleared");
    cache.get(key, function(key, cache)
    {
        setTimeout(function()
        {
            cache.set(key, value, 0);
            equal(cache.get(key), value, "Key '" + key + "' has value '" + value + "'");
            start();
        }, 1E1);
    });
});

// Expired values removed by internal GC
asyncTest("Value cleaned up by internal GC", 2, function()
{
    var key = "name";
    var value = "John Doe";
    cache.clear();
    cache.set(key, value, 1);
    equal(cache.get(key), value, "Key '" + key + "' has value '" + value + "'");
    setTimeout(function()
    {
        strictEqual(cache.storage[key], undefined, "Key '" + key + "' is removed from cache");
        start();
    }, 2);
});


// Value with no expiry not removed by internal GC
asyncTest("Value not removed by internal GC", 2, function()
{
    var key = "name";
    var value = "John Doe";
    cache.clear();
    cache.set(key, value, 0);
    equal(cache.get(key), value, "Key '" + key + "' has value '" + value + "'");
    setTimeout(function()
    {
        strictEqual(cache.get(key), value, "Key '" + key + "' is not removed from cache");
        start();
    }, cache.gcTimeout);
});

// Item, with no expiry replaces item with expiry, not removed by GC
asyncTest("Item, with no expiry replacing item with expiry, not removed by GC", 1, function()
{
    var key = "name";
    var value = "John Doe";
    cache.clear();
    cache.set(key, value, 1E2);
    cache.set(key, value, 0);
    setTimeout(function()
    {
        equal(cache.get(key), value, "Item not removed");
        start();
    }, 1E2);
});

// Making sure GC not running if key is updated with future expiry time
asyncTest("Item update with future expiry date not expiring", 1, function()
{
    var key = "name";
    var value = "John Doe";
    var newValue = "Jane Doe";
    cache.clear();
    cache.set(key, value, 1E1);
    cache.set(key, newValue, 1E5);

    setTimeout(function()
    {
        equal(cache.get(key), newValue, "Item not removed");
        start();
    }, 1E1);
});

// Garbage collectors initialized for items retrieved from local storage
test("Garbage collectors initialized for items retrieved from local storage", function()
{
	var keys = ["name", "age"];
	var values = ["John Doe", 26];
	cache.clear();
	cache.set(keys[0], values[0], 3600);
	cache.set(keys[1], values[1], 3600);
	cache = null;
	cache = new Cache();
	ok(cache.garbageCollector.collectors[keys[0]] !== undefined, "Garbage collector initialized for '" + keys[0] + "'");
	ok(cache.garbageCollector.collectors[keys[1]] !== undefined, "Garbage collector initialized for '" + keys[1] + "'");
});

// Item removed immediately on expiration way back in time
test("Item immediately on expiration way back in time", function()
{
	var key = "name";
	var value = "John Doe";
	cache.clear();
	cache.set(key, value, (-1) * 1E2);
	strictEqual(cache.get(name), undefined, "Item expired");
});

// Removes an item
test("Item removed", function()
{
	var key = "name";
	var value = "John Doe";
	cache.clear();
	cache.set(key, value, 3600);
	cache.remove(key);
	strictEqual(cache.get(key), undefined, "Key " + key + " removed");
	strictEqual(cache.garbageCollector.collectors[key], undefined, "GC for " + key + " removed");
});

/** Namespacing **/
test("Two cache objects don't share values in local storage for key with joint name", function()
{
    var one = new Cache('one');
    var two = new Cache('two');
    var key = "name";
    var male = "John Doe";
    var female = "Jane Doe";
    
    one.set(key, male, 0);
    two.set(key, female, 0);
    one = null;
    two = null;
    one = new Cache('one');
    two = new Cache('two');
    equal(one.get(key), male, "First cache correct value");
    equal(two.get(key), female, "Second cache correct value");
});