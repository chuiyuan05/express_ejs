/**
 * Created by chuiyuan on 16-7-31.
 */
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var crawlerLib = require('../lib/crawler');
var express = require('express');
var router = express.Router();
var url = require('url');


router.get('/', function (req, res, next) {
    var render_res = res ;
    var booklist = [];
    var bookUrllist ;
    var count =0;
    
    crawlerLib.getBookListUrl(function (result) {
        bookUrllist = result;
        var ep = new eventproxy();
        
        ep.after('crawler_finished',bookUrllist.length, function(){
            render_res.render('crawler',{
                title: 'Crawler Douban'
                //booklist: booklist
            })
        });
        
        bookUrllist.forEach(function(bookurl){
            crawlerLib.getUrlContent(bookurl, function (abook) {
                var book = crawlerLib.getBookInfo(abook);
                booklist.push(book);
                console.log('has finished '+count +' total '+bookUrllist.length);
                ep.emit('crawler_finished');
                count++;
            })    
        });
        /*for (var i=0; i<bookUrllist.length;i++){
            crawlerLib.getUrlContent(bookUrllist[i], function (abook) {
                var book = crawlerLib.getBookInfo(abook);
                booklist.push(book);
                count++;
                console.log('has finished:'+count+', total:'+bookUrllist.length);
            })
        }
        //setInterval(function () {
            render_res.render('crawler',
                { title: 'Express' });
            /*if(count < bookUrllist.length){
                console.log('yelp');
                render_res.render('crawler',{
                    title :'Crawler',
                    booklsit : booklist
                });
            }*/
        //},200);
    })
});

module.exports = router;