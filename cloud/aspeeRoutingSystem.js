module.exports = {
	resourceGroupForResourceUseRequest: function (customerLocation, resources) {
		return getHighestRankedResource(customerLocation, resources);
	}
};


function getHighestRankedResource (customerLocation, resources) {
	var lowestCost = Number.MAX_VALUE;
	var highestRankedResource = null;
	resources.forEach(function (resource) {
		var queueLength = resource.queue.length;
		var distance = calculateDistance(customerLocation.x, customerLocation.y, resource.location.x, resource.location.y);
		var cost = calculateCost(queueLength, distance);
		if (cost < lowestCost) {
			highestRankedResource = resource;
		}
	});
	return highestRankedResource;
}

function calculateDistance (xa, ya, xb, yb) {
	return Math.sqrt(((xa - xb) * (xa - xb)) + ((ya - yb) * (ya - yb)));
}

function calculateCost (length, distance) {
	return distance;
}
