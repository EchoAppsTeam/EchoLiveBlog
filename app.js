(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.LiveBlogging")) return;

var blog = Echo.App.manifest("Echo.Apps.LiveBlogging");

blog.config = {
	"targetURL": "",
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

blog.templates.main =
	'<div class="{class:container}"></div>';

blog.renderers.container = function(element) {
	this.initComponent({
		"id": "conversations",
		"component": "Echo.Apps.Conversations",
		"config": $.extend(true, {}, this.config.get("advanced"), {
			"target": element,
			"targetURL": this.config.get("targetURL"),
			"postComposer": {
				"visible": this.user.is("admin")
			},
			"dependencies": this.config.get("dependencies")
		})
	});
	return element;
};

blog.dependencies = [{
	"url": "//cdn.echoenabled.com/apps/echo/conversations/v1.3/dev/app.js",
	"app": "Echo.Apps.Conversations"
}];

Echo.App.create(blog);

})(Echo.jQuery);
