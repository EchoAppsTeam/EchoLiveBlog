(function($) {
"use strict";

if (Echo.AppServer.Dashboard.isDefined("Echo.Apps.LiveBlog.Dashboard")) return;

var dashboard = Echo.AppServer.Dashboard.manifest("Echo.Apps.LiveBlog.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.mappings = {
	"dependencies.appkey": {
		"key": "dependencies.StreamServer.appkey"
	},
	"dependencies.janrainapp": {
		"key": "dependencies.Janrain.appId"
	}
};

dashboard.config.ecl = [{
	"component": "Group",
	"name": "dependencies",
	"type": "object",
	"config": {
		"title": "Dependencies",
		"expanded": false
	},
	"items": [{
		"component": "Select",
		"name": "appkey",
		"type": "string",
		"config": {
			"title": "StreamServer application key",
			"desc": "Specifies the application key for this instance",
			"options": []
		}
	}, {
		"component": "Select",
		"name": "janrainapp",
		"type": "string",
		"config": {
			"title": "Janrain application ID",
			"validators": ["required"],
			"options": []
		}
	}, {
		"component": "Fieldset",
		"name": "FilePicker",
		"type": "object",
		"items": [{
			"component": "Input",
			"name": "apiKey",
			"type": "string",
			"config": {
				"title": "FilePicker API key",
				"desc": "Specifies the Filepicker api key for this instance",
				"options": []
			}
		}]
	}, {
		"component": "Fieldset",
		"name": "embedly",
		"type": "object",
		"items": [{
			"component": "Input",
			"name": "apiKey",
			"type": "string",
			"config": {
				"title": "Embed.ly API Key"
			}
		}]
	}]
}, {
	"component": "Dashboard",
	"name": "advanced",
	"type": "object",
	"config": {
		"title": "Advanced",
		"component": "Echo.Apps.Conversations.Dashboard",
		"url": "//cdn.echoenabled.com/apps/echo/conversations/v2/dashboard.js",
		"config": {
			"disableSettings": ["targetURL", "postComposer.visible", "dependencies"]
		}
	},
	"items": []
}, {
	"component": "Echo.DataServer.Controls.Dashboard.DataSourceGroup",
	"name": "targetURL",
	"type": "string",
	"required": true,
	"config": {
		"title": "",
		"expanded": false,
		"labels": {
			"dataserverBundleName": "Echo LiveBlog Auto-Generated Bundle for {instanceName}"
		},
		"apiBaseURLs": {
			"DataServer": "{%= apiBaseURLs.DataServer %}/"
		}
	}
}];

dashboard.config.normalizer = {
	"ecl": function(obj, component) {
		var self = this;
		return $.map(obj, function(field) {
			if (field.name === "advanced") {
				field.config = $.extend(true, field.config, {
					"config": {
						"data": $.extend(true, {}, self.get("data"), {
							"instance": {"config": self.get("data.instance.config.advanced")}
						}),
						"request": self.get("request")
					}
				});
			}
			return field;
		});
	}
};

dashboard.modifiers = {
	"dependencies.appkey": {
		"endpoint": "customer/{self:user.getCustomerId}/appkeys",
		"processor": function() {
			return this.getAppkey.apply(this, arguments);
		}
	},
	"dependencies.janrainapp": {
		"endpoint": "customer/{self:user.getCustomerId}/janrainapps",
		"processor": function() {
			return this.getJanrainApp.apply(this, arguments);
		}
	},
	"targetURL": {
		"endpoint": "customer/{self:user.getCustomerId}/subscriptions",
		"processor": function() {
			return this.getBundleTargetURL.apply(this, arguments);
		}
	}
};

dashboard.init = function() {
	this.parent();
};

dashboard.dependencies = [{
	"url": "{config:cdnBaseURL.apps.dataserver}/dashboards.pack.js",
	"control": "Echo.DataServer.Controls.Pack"
}];

Echo.AppServer.Dashboard.create(dashboard);

})(Echo.jQuery);
