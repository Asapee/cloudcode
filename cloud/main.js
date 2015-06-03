// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function (request, response) {
	response.success("Hello world!");
});

function isCodeValid (code) {
	return code === "1234";
}

Parse.Cloud.define("unlock", function (request, response) {
	if (isCodeValid(request.params.keyCode)) {
		response.success();
	} else {
		response.error("invalid code");
	}
});

Parse.Cloud.beforeSave("ResourceUseRequest", function (request, response) {
	var ResourceQueue = Parse.Object.extend("ResourceQueue");
	var query = new Parse.Query(ResourceQueue);
	query.first({
		success: function (resourceQueue) {
			request.object.set("resourceQueue", resourceQueue);
			response.success();
		}
	});
});
