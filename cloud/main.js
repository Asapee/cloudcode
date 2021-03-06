// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:

var Resource = Parse.Object.extend("Resource");
var ResourceQueue = Parse.Object.extend("ResourceQueue");
var ResourceGroup = Parse.Object.extend("ResourceGroup");
var ResourceUseRequest = Parse.Object.extend("ResourceUseRequest");
var ResourceUsageVoucher = Parse.Object.extend("ResourceUsageVoucher");

function isCodeValid (code) {
	return code === "1234";
}

Parse.Cloud.afterSave("ResourceUseRequest", function (request) {
	var query = new Parse.Query(ResourceQueue);
	query.first({
		success: function (resourceQueue) {
			resourceQueue.add("resourceUseRequests", request.object.id);
			resourceQueue.save();
		}
	});
});

Parse.Cloud.define("unlockDoor", function (request, response) {
	var query = new Parse.Query(ResourceUsageVoucher);
	var resourceUseVoucherId = request.params.resourceUseVoucherId;
	var resourceUseRequestId = request.params.resourceUseRequestId;
	query.equalTo("objectId", resourceUseVoucherId);
	query.first({
		success: function (resourceUseVoucher) {
			var query = new Parse.Query(ResourceQueue);
			query.first().then(function (resourceQueue) {
				resourceQueue.remove("resourceUseRequests", resourceUseRequestId);
				resourceQueue.save();
				resourceUseVoucher.destroy();
				var query = new Parse.Query(Resource);
				query.first({
					success: function (resource) {
						resource.set("isAvailable", true);
						resource.save().then(function () {
							response.success();
						});
					}
				})
			});
		},
		error: function (e) {
			response.error("something else");
		}
	});
});

Parse.Cloud.define("isDoorOpen", function (request, response) {
	var query = new Parse.Query(Resource);
	query.first({
		success: function (resource) {
			response.success(resource.get("isAvailable"));
		}
	})
});

Parse.Cloud.define("getPositionInQueue", getPositionInQueue);
Parse.Cloud.define("getWaitTime", function (request, response) {
	getPositionInQueue(request, response)
		.then(function (indexOfUserInQueue) {
			if (indexOfUserInQueue === -1) {
				throw new Error("user has no resourceUseRequest in queue");
			}
			var oneMinute = 1000 * 60;
			return response.success(oneMinute * 5 * indexOfUserInQueue);
		})
});


function getPositionInQueue (request, response) {
	var userQuery = new Parse.Query(Parse.User);
	userQuery.equalTo("objectId", request.params.userId);
	return userQuery.first()
		.then(function (user) {
			if (!user) {
				throw new Error("user not found");
			}
			return user;
		})
		.then(getResourceUseRequest)
		.then(function (resourceUseRequest) {
			if (!resourceUseRequest) {
				throw new Error("resource use request not found");
			}
			var queueQuery = new Parse.Query(ResourceQueue).first();
			return queueQuery.then(function (queue) {
				var queueRequests = queue.get("resourceUseRequests");
				var indexOfUserInQueue = queueRequests.indexOf(resourceUseRequest.id);
				return indexOfUserInQueue;
			});
		})
		.then(undefined, function (e) {
			return response.error(e);
		});
}

function getResourceUseRequest () {
	var user = Parse.User.current();
	var resourceUseRequestQuery = new Parse.Query(ResourceUseRequest);
	resourceUseRequestQuery.equalTo("user", user);
	return resourceUseRequestQuery.first();
}

