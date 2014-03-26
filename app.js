(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.LiveBlogging")) return;

var blog = Echo.App.manifest("Echo.Apps.LiveBlogging");

blog.config = {
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	},
	"advanced": {}
};

blog.config.normalizer = {
	"dependencies": function(value) {
		// Parameters order in a config might be different,
		// so we are handling all possible situations to make sure
		// that all required params are defined.
		var streamServer = Echo.Utils.get(value, "StreamServer", {});
		this.set("appkey", streamServer.appkey);
		this.set("apiBaseURL", streamServer.apiBaseURL);
		this.set("submissionProxyURL", streamServer.submissionProxyURL);
		return value;
	},
	"appkey": function(value) {
		return Echo.Utils.get(this.data, "dependencies.StreamServer.appkey", value);
	},
	"apiBaseURL": function(value) {
		return Echo.Utils.get(this.data, "dependencies.StreamServer.apiBaseURL", value);
	},
	"submissionProxyURL": function(value) {
		return Echo.Utils.get(this.data, "dependencies.StreamServer.submissionProxyURL", value);
	}
};

blog.init = function() {
	this._removeUserInvalidationFrom(this);
	this.render();
	this.ready();
};

blog.templates.main =
	'<div class="{class:container}"></div>';

blog.renderers.container = function(element) {
	this.initComponent({
		"id": "conversations",
		"component": "Echo.Apps.Conversations",
		"config": $.extend(true, {}, this.config.get("advanced"), {
			"target": element,
			"postComposer": {
				"visible": this.user.is("admin")
			},
			"dependencies": this.config.get("dependencies")
		})
	});
	return element;
};

// removing "Echo.UserSession.onInvalidate" subscription from an app
// to avoid double-handling of the same evernt (by Canvas and by the widget itself)
blog.methods._removeUserInvalidationFrom = function() {
	var topic = "Echo.UserSession.onInvalidate";
	$.map(Array.prototype.slice.call(arguments), function(inst) {
		$.each(inst.subscriptionIDs, function(id) {
			var obj = $.grep(Echo.Events._subscriptions[topic].global.handlers, function(o) {
				return o.id === id;
			})[0];
			if (obj && obj.id) {
				Echo.Events.unsubscribe({"handlerId": obj.id});
				return false;
			}
		});
	});
};

blog.dependencies = [{
	"url": "//cdn.echoenabled.com/apps/echo/conversations/v1.3/dev/app.js",
	"app": "Echo.Apps.Conversations"
}];

Echo.App.create(blog);

})(Echo.jQuery);
