sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("car.lease.users.controller.View1", {

		accessToken: null,

		serviceKey: {
			// "channelId": "dev627077c8-e9a6-4ffb-b368-01ef0c303dd5carlease.vehicle",
			"serviceUrl": "https://hyperledger-fabric.cfapps.eu10.hana.ondemand.com/api/v1",
			"chaincodePath": "/chaincodes/627077c8-e9a6-4ffb-b368-01ef0c303dd5-com-sap-blockchain-carlease/latest/",
			"ownersPath": "owners/",
			"oAuth": {
				"clientId": "sb-34d0015d-0a99-496a-8fcd-e74ea546e694!b5485|na-420adfc9-f96e-4090-a650-0386988b67e0!b1836",
				"clientSecret": "IUTA1zPBP0ZO2m7k75nqDvAIo6w=",
				"url": "https://i300455trial.authentication.eu10.hana.ondemand.com"
			}
		},

		onInit: function () {
			var oViewModel = new JSONModel({});
			this.getView().setModel(oViewModel, "newUserModel");
			var that = this;
			this.getToken(this.serviceKey.oAuth.url + "/oauth/token?grant_type=client_credentials",
					this.serviceKey.oAuth.clientId,
					this.serviceKey.oAuth.clientSecret)
				.then(
					function (result) {
						var formData = new FormData(),
							xhr = new XMLHttpRequest(),
							serviceUrl = that.serviceKey.serviceUrl + that.serviceKey.chaincodePath + that.serviceKey.ownersPath;
						that.accessToken = result;
						xhr.open("GET", serviceUrl);
						xhr.setRequestHeader("Authorization", "Bearer " + result);
						xhr.withCredentials = true; // CORS
						xhr.onload = function () {
							if (xhr.status === 200) {
								var data = JSON.parse(xhr.response),
									oModel = new JSONModel(data);
								that.getView().byId("CarLeaseUsersTable").setModel(oModel);
							}
						};
						xhr.send(formData);
					}
				);
		},

		getToken: function (url, clientId, clientSecret, serviceUrl) {
			return new Promise(function (resolve, reject) {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, true);
				xhr.setRequestHeader("Authorization", "Basic " + btoa(clientId + ":" + clientSecret));
				xhr.onload = function () {
					if (xhr.status === 200) {
						var authData = JSON.parse(xhr.response);
						resolve(authData.access_token, serviceUrl);
					}
					reject();
				};
				xhr.send();
			});
		},

		onNewUserButtonPress: function () {
			var sFragId;
			if (!this._newUserDialog) {
				sFragId = this.createId("idNewUserDialogFrag");
				this._newUserDialog = sap.ui.xmlfragment(sFragId, "car.lease.users.fragments.NewUser", this);
				this.getView().addDependent(this._newUserDialog);
			}
			this._newUserDialog.setModel(this.getView().getModel("DeferCodeModel"));
			this._newUserDialog.open();
		},

		onNewUserDialogCancel: function () {
			if (this._newUserDialog) {
				this._newUserDialog.close();
			}
		},

		onNewUserDialogOK: function () {
			var oModel = this.getView().getModel("newUserModel"),
				data = oModel.getData(),
				serviceUrl = this.serviceKey.serviceUrl + this.serviceKey.chaincodePath + this.serviceKey.ownersPath + data.userId,
				xhr = new XMLHttpRequest(),
				that = this;

			var oNewUser = {
				"username": data.userName,
				"company": data.userCompany,
				"ownerType": data.ownerType
			};

			xhr.open("POST", serviceUrl);
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken);
			xhr.onload = function () {
				if (xhr.status === 200) {
					MessageToast.show("New user has been created");
					that.onNewUserDialogCancel();
					oModel.setProperty("/", "");
					that.refreshWorklist();
				} else {
					MessageToast.show("Calling the API failed");
				}
			};
			xhr.send(JSON.stringify(oNewUser));
		},

		refreshWorklist: function () {
			var formData = new FormData(),
				xhr = new XMLHttpRequest(),
				serviceUrl = this.serviceKey.serviceUrl + this.serviceKey.chaincodePath + this.serviceKey.ownersPath,
				that = this;
			xhr.open("GET", serviceUrl);
			xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken);
			xhr.withCredentials = true; // CORS
			xhr.onload = function () {
				if (xhr.status === 200) {
					var data = JSON.parse(xhr.response),
						oModel = new JSONModel(data);
					that.getView().byId("CarLeaseUsersTable").setModel(oModel);
				}
			};
			xhr.send(formData);
		}
	});
});