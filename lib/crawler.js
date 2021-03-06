/**
 * Created by chuiyuan on 16-7-31.
 */
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var DOUBAN = require('./douban');
var superagent = require('superagent');

var Crawler = {
    getBookInfo : function(content){
        var book = {};
        var $ = cheerio.load(content);
        book.name = $('#wrapper > h1 span').text();
        book.author = $('#info > span a').text();
        var _text = $('#info').text();
        var _textarr = _text.split(':');
        book.ISBN = _textarr[_textarr.length-1];
        console.log(book);
        return book;
    },
    getUrlContent : function(targetUrl, callback){
        console.log('start pull '+targetUrl +'...');
        superagent.get(targetUrl)
            .end(function (err, res) {
                console.log(targetUrl+ 'finished');
                callback(res.text)
            });
    },
    getBookListUrl : function(p_callback){
        this.getUrlContent(DOUBAN.index, function (content) {
            var $ = cheerio.load(content);
            var booklist = [];
            $('li .cover a').each(function (edx, element) {
                var href = $(element).attr('href');
                booklist.push(href);
            });
            p_callback(booklist);
        })
    },
    eventProxy : function(){
        var ep = new eventproxy();
        ep.after('getBook_html', booklist.length,function (booklist) {
            booklist = booklist.map(function (book) {

            });
        });
    }
}

module.exports = Crawler ;
