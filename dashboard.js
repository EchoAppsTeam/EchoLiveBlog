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
	"component": "Echo.DataServer.Controls.Dashboard.DataSourceGroup",
	"name": "targetURL",
	"type": "string",
	"required": true,
	"config": {
		"title": "",
		"labels": {
			"dataserverBundleName": "Echo LiveBlog Auto-Generated Bundle for {instanceName}"
		},
		"apiBaseURLs": {
			"DataServer": "{%=baseURLs.dataserver%}/"
		}
	}
}, {
	"component": "Group",
	"name": "dependencies",
	"type": "object",
	"config": {
		"title": "Dependencies"
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

dashboard.init = function() {
	var self = this;
	var parent = $.proxy(this.parent, this);
	this._fetchData(function() {
		self.config.set("ecl", self._prepareECL(self.config.get("ecl")));
		parent();
	});
};

dashboard.methods._prepareECL = function(items) {
	var self = this;
	var instructions = {
		"targetURL": function(item) {
			item.config = $.extend({
				"bundle": {
					"url": self.get("data.instance.provisioningDetails.dataServerBundleURL")
				},
				"domains": self.get("domains"),
				"apiToken": self.get("dataserverToken"),
				"instanceName": self.get("data.instance.name"),
				"valueHandler": function() {
					return self._assembleTargetURL();
				}
			}, item.config);
			return item;
		},
		"dependencies.appkey": function(item) {
			item.config.options = $.map(self.get("appkeys"), function(appkey) {
				return {
					"title": appkey.key,
					"value": appkey.key
				};
			});
			return item;
		},
		"dependencies.janrainapp": function(item) {
			item.config.options = $.map(self.get("janrainapps"), function(app) {
				return {
					"title": app.name,
					"value": app.name
				};
			});
			return item;
		}
	};
	return (function traverse(items, path) {
		return $.map(items, function(item) {
			var _path = path ? path + "." + item.name : item.name;
			if (item.type === "object" && item.items) {
				item.items = traverse(item.items, _path);
			} else if (instructions[_path]) {
				item = instructions[_path](item);
			}
			return item;
		});
	})(items, "");
};

dashboard.methods.declareInitialConfig = function() {
	var keys = this.get("appkeys", []);
	var apps = this.get("janrainapps", []);
	return {
		"targetURL": this._assembleTargetURL(),
		"dependencies": {
			"Janrain": {
				"appId": apps.length ? apps[0].name : undefined
			},
			"StreamServer": {
				"appkey": keys.length ? keys[0].key : undefined
			},
			"FilePicker": {
				"apiKey": "AFLWUBllDRwWZl7sQO1V1z"
			},
			"embedly": {
				"apiKey": "5945901611864679a8761b0fcaa56f87"
			}
		}
	};
};

dashboard.methods._fetchData = function(callback) {
	var self = this;
	var request = this.config.get("request");
	var deferreds = [];
	var requests = {
		"dataserverToken": {
			"endpoint": "customer/{customerId}/subscriptions",
			"processor": function(response) {
				var ds = $.grep(response, function(subscription) {
					return Echo.Utils.get(subscription, "app.name") === "dataserver";
				})[0];
				return Echo.Utils.get(ds, "extra.token", "");
			}
		},
		"domains": {
			"endpoint": "customer/{customerId}/domains"
		},
		"janrainapps": {
			"endpoint": "customer/{customerId}/janrainapps"
		},
		"appkeys": {
			"endpoint": "customer/{customerId}/appkeys"
		}
	};
	$.map(requests, function(requestData, requestId) {
		var deferredId = deferreds.push($.Deferred()) - 1;
		request($.extend(true, {
			"customerId": self.config.get("data.customer.id"),
			"success": function(response) {
				self.set(requestId, requestData.processor ? requestData.processor(response) : response);
				deferreds[deferredId].resolve();
			},
			"fail": function() {
				// TODO handle errors
				deferreds[deferredId].reject();
			}
		}, requestData));
	});
	$.when.apply($, deferreds).done(callback);
};

dashboard.methods._assembleTargetURL = function() {
	var provisionedURL = this.get("data.instance.provisioningDetails.targetURL");
	if (provisionedURL) {
		return provisionedURL;
	}

	var re = new RegExp("\/" + this.get("data.instance.name") + "$");
	var targetURL = this.get("data.instance.config.targetURL");

	if (!targetURL || !targetURL.match(re)) {
		targetURL =	"http://" + this.get("domains", [])[0] + "/social-source-input/" + this.get("data.instance.name");
	}

	return targetURL;
};

dashboard.dependencies = [{
	"url": "//cdn.echoenabled.com/apps/echo/dataserver/v3/full.pack.js",
	"control": "Echo.DataServer.Controls.Pack"
}];

Echo.AppServer.Dashboard.create(dashboard);

})(Echo.jQuery);
