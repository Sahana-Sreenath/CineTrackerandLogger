import {Client as ElasticClient} from "elasticsearch";
var elasticsearch = require('elasticsearch');
var elasticData;
const request = require('request-promise');
var elasticSearchConfig = functions.config().elasticsearch;
var path = require('path');
var client = new elasticsearch.Client({
    hosts: ['http://localhost:3000/']});

define([

], function (

) {

    var ID_PROPERTY = '_id',
        SOURCE_PROPERTY = '_source',
        SCORE_PROPERTY = '_score';

    /**
     * A search service which searches through domain objects in
     * the filetree using ElasticSearch.
     *
     * @constructor
     * @param $http Angular's $http service, for working with urls.
     * @param ROOT the constant `ELASTIC_ROOT` which allows us to
     *        interact with ElasticSearch.
     */
    function ElasticSearchProvider($http, ROOT) {
        this.$http = $http;
        this.root = ROOT;
    }

    /**
     * Search for domain objects using elasticsearch as a search provider.
     *
     * @param {String} searchTerm the term to search by.
     * @param {Number} [maxResults] the max number of results to return.
     * @returns {Promise} promise for a modelResults object.
     */
    ElasticSearchProvider.prototype.query = function (searchTerm, maxResults) {
        var searchUrl = this.root + '/_search/',
            params = {},
            provider = this;

        searchTerm = this.cleanTerm(searchTerm);
        searchTerm = this.fuzzyMatchUnquotedTerms(searchTerm);

        params.q = searchTerm;
        params.size = maxResults;

        return this
            .$http({
                method: "GET",
                url: searchUrl,
                params: params
            })
            .then(function success(succesResponse) {
                return provider.parseResponse(succesResponse);
            }, function error() {
                // Gracefully fail.
                return {
                    hits: [],
                    total: 0
                };
            });
    };


    /**
     * Clean excess whitespace from a search term and return the cleaned
     * version.
     *
     * @private
     * @param {string} the search term to clean.
     * @returns {string} search terms cleaned of excess whitespace.
     */
    ElasticSearchProvider.prototype.cleanTerm = function (term) {
        return term.trim().replace(/ +/g, ' ');
    };

    /**
     * Add fuzzy matching markup to search terms that are not quoted.
     *
     * The following:
     *     hello welcome "to quoted village" have fun
     * will become
     *     hello~ welcome~ "to quoted village" have~ fun~
     *
     * @private
     */
    ElasticSearchProvider.prototype.fuzzyMatchUnquotedTerms = function (query) {
        var matchUnquotedSpaces = '\\s+(?=([^"]*"[^"]*")*[^"]*$)',
            matcher = new RegExp(matchUnquotedSpaces, 'g');

        return query
            .replace(matcher, '~ ')
            .replace(/$/, '~')
            .replace(/"~+/, '"');
    };

    /**
     * Parse the response from ElasticSearch and convert it to a
     * modelResults object.
     *
     * @private
     * @param response a ES response object from $http
     * @returns modelResults
     */
    ElasticSearchProvider.prototype.parseResponse = function (response) {
        var results = response.data.hits.hits,
            searchResults = results.map(function (result) {
                return {
                    id: result[ID_PROPERTY],
                    model: result[SOURCE_PROPERTY],
                    score: result[SCORE_PROPERTY]
                };
            });

        return {
            hits: searchResults,
            total: response.data.hits.total
        };
    };

    return ElasticSearchProvider;
});