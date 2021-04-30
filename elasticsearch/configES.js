import {Client as ElasticClient} from "elasticsearch";
var elasticsearch = require('elasticsearch');
var elasticData;
const request = require('request-promise');
var elasticSearchConfig = functions.config().elasticsearch;
var path = require('path');
var client = new elasticsearch.Client({
    hosts: ['http://localhost:3000/']});

import type {
  ElasticQuery,
  ElasticAggsQuery,
  ElasticSearchResp,
  ElasticAggsBucketTermsResp,
  ElasticAggsBucketNestedTermsResp,
} from "./types";

    
let searchParam={
    index: 'search',
    type: 'TMDBmovies',
    body: {
        query: {
            term: { "Moviename": $(movieTitle)}
        },
    }
};

    
class Search {
    // Class meant to provide internal endpoints able to query Elasticsearch

    constructor(options) {
        this.options = options;
        this.elasticSearch = options.elasticSearch;
    }

    static requestURI(elasticSearch) {
        // Generate an incomplete uri that points to Elasticsearch
        if (elasticSearch) {
            const scheme = (elasticSearch.scheme) ? `${elasticSearch.scheme}://` : '';
            const host = elasticSearch.host || '';
            const port = (elasticSearch.port) ? `:${elasticSearch.port}` : '';
            const path = elasticSearch.path || '';

            return `${scheme}${host}${port}${path}`;
        } else { // Fail with 500 if elasticSearch conf is not set
            throw new HTTPError({
                status: 500,
                body: {
                    type: 'internal_error',
                    detail: 'Elasticsearch configuration not set',
                }
            });
        }
    }

    buildRequest(index,query) {
        // Generate a http request to Elasticsearch
        return {
            uri: `${Search.requestURI(this.elasticSearch)}/${index}/_search`,
            headers: { "Content-Type": "application/json" },
            body: query
        };
    }
}

export const client = (() => {
  let cache;
  const fn = async (host: string, port: number): ElasticClient => {
    if (cache != null) return cache;
    cache = new ElasticClient({host: `${host}:${port}`, log: "debug"});
    return cache;
  };
  return fn;
})();

export const search = (
  elastic: ElasticClient,
  index: string,
  body: ElasticQuery,
  opts: {|from: number, size: number|} = {from: 0, size: 30},
): Promise<ElasticSearchResp> => elastic.search({index, body, ...opts});

export const aggregateTerms = (
  elastic: ElasticClient,
  index: string,
  body: ElasticAggsQuery,
): Promise<ElasticAggsBucketTermsResp> => elastic.search({index, body});

export const aggregateNestedTerms = (
  elastic: ElasticClient,
  index: string,
  body: ElasticAggsQuery,
): Promise<ElasticAggsBucketNestedTermsResp> => elastic.search({index, body});
    
exports.indexPostsToElastic = functions.database.ref('/posts/{post_id}')
	.onWrite(event => { 
		let postData = event.data.val();
		let post_id = event.params.post_id;
		
		console.log('Indexing post:', postData);
		
		let elasticSearchConfig = functions.config().elasticsearch;
		let elasticSearchUrl = elasticSearchConfig.url + 'posts/post/' + post_id;
		let elasticSearchMethod = postData ? 'POST' : 'DELETE';
		
		let elasticSearchRequest = {
			method: elasticSearchMethod,
			url: elasticSearchUrl,
			auth:{
				username: elasticSearchConfig.username,
				password:elasticSearchConfig.password,
			},
			body: postData,
			json: true
		};
		return request(elasticSearchRequest).then(response =>{
			return console.log("ElasticSearch response", response);
		});
	});