/**
 * Created by chuiyuan on 16-8-4.
 */
var express = require('express');
var router = express.Router();
var eventprxy = require('eventproxy');
var crawlerLib = require('../lib/crawler_q.js');
var DOUBAN = require('../lib/douban.js');

router.get('/', function(req, res, next){
    var render_res = res ;
    var booklist =[];
    var bookUrlList;
    var count =0;
    
    crawlerLib.getUrlContent(DOUBAN.index)
        .then(function(content){
            return crawlerLib.getBookListUrl(content);
        })
        .then(function(result){
            bookUrlList = result;
            var ep = new eventprxy();
            ep.after('crawler_finished',bookUrlList.length, function(){
                console.log('render crawler');
                render_res.render('crawler',{
                    title: 'Crawler'
                });
            });
            bookUrlList.forEach(function(bookurl){
                crawlerLib.getUrlContent(bookurl)
                    .then(function(abook){
                        var book = crawlerLib.getBookInfo(abook);
                        console.log(book);
                        booklist.push(book);
                        console.log('has finished '+count+' total '+booklist.length);
                        ep.emit('crawler_finished');
                        console.log('append to file '+ DOUBAN.resultFile);
                        crawlerLib.appendFile(DOUBAN.resultFile, crawlerLib.generateStr(book))
                        count++;
                        console.log('bookUrlList len:'+bookUrlList.length);
                    })
            })
        })
});     

module.exports = router ;
