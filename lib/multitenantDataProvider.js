/*!
 * Copyright(c) 2014 Jan Blaha
 *
 * This data provider is prefixing collections with tenant name
 */

/*globals $data */

var _ = require("underscore"),
    mongoProvider = require("../node_modules/jsreport/lib/jaydata/mongoDBStorageProvider.js");


var MultitenantDataProvider = module.exports = function(connectionString, options) {
    this.connectionString = connectionString;
    this.tenant = options.tenant;
    this.connectionString.logger = options.logger;
    this._entitySets = {};
};

MultitenantDataProvider.prototype.buildContext = function() {
    this.ContextDefinition = $data.Class.defineEx(this.extendGlobalTypeName("jsreport.Context"),
        [$data.EntityContext, $data.ServiceBase], null, this._entitySets);
};

MultitenantDataProvider.prototype.createEntityType = function(name, attributes) {
    return $data.Class.define(this.extendGlobalTypeName(name), $data.Entity, null, attributes, null);
};

MultitenantDataProvider.prototype.registerEntitySet = function(name, type, options) {
    var entitySet = { type: $data.EntitySet, elementType: type };
    _.extend(entitySet, options);

    entitySet.tableName = (!this.tenant || this.tenant.name === "") ?  name :
        (this.tenant.name + '-' + name);

    this._entitySets[name] = entitySet;
    return entitySet;
};

MultitenantDataProvider.prototype.dropStore = function(fn) {
    var droppingConnection = _.extend({}, this.connectionString);
    droppingConnection.dbCreation = $data.storageProviders.DbCreationType.DropAllExistingTables;
    var context = new this.ContextDefinition(droppingConnection);

    if (fn) {
        return context.onReady(fn);
    }

    return context.onReady();
};

MultitenantDataProvider.prototype.extendGlobalTypeName = function (typeName) {
    if (!this.tenant || this.tenant.name === "")
        return typeName;

    return this.tenant.name.replace(/-/g, '') + "." + typeName;
};

MultitenantDataProvider.prototype.startContext = function(fn) {
    var context = new this.ContextDefinition(this.connectionString);

    if (fn) {
        return context.onReady(fn);
    }

    return context.onReady();
};