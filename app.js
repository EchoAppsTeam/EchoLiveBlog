(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.LiveBlogging")) return;

var blog = Echo.App.manifest("Echo.Apps.LiveBlogging");

blog.events = {
	"Echo.UserSession.onInvalidate": {
		"context": "global",
		"handler": function(_, data) {
			var userState = this.user.is("admin") ? "admin" : "user";
			if (userState !== this.get("previousUserState")) {
				this.set("previousUserState", userState);
				this.refresh();
			}
		}
	}
};

blog.config = {
	"refreshOnUserInvalidate": false,
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

blog.vars = {
	"previousUserState": "user" // "user" or "admin"
};

blog.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:auth}"></div>' +
		'<div class="{class:comments}"></div>' +
	'</div>';

blog.init = function() {
	this.set("previousUserState", this.user.is("admin") ? "admin" : "user");
	this.render();
	this.ready();
};

blog.renderers.auth = function(element) {
	if (this.user.is("admin")) {
		return element.empty().hide();
	}
	this.initComponent({
		"id": "auth",
		"component": "Echo.StreamServer.Controls.Auth",
		"config": {
			"target": element,
			"plugins": [{
				"name": "JanrainConnector",
				"appId": this.config.get("dependencies.Janrain.appId")
			}]
		}
	});
	return element;
};

blog.renderers.comments = function(element) {
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
	"url": "//cdn.echoenabled.com/apps/echo/conversations/v2/app.js",
	"app": "Echo.Apps.Conversations"
}, {
	"url": "//cdn.echoenabled.com/apps/echo/conversations/v2/streamserver.pack.js",
	"app": "Echo.StreamServer.Controls.Auth"
}];

Echo.App.create(blog);

})(Echo.jQuery);
