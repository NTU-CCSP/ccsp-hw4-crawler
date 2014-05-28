var request = require('request');
var cheerio = require('cheerio');
var Q = require('q');
var fs = require('fs');

var URL = 'http://www.appledaily.com.tw/realtimenews/section/new/';
var Domain = 'http://www.appledaily.com.tw';
var categories = ["動物", "FUN", "瘋啥", "搜奇", "正妹", "體育", "臉團", "娛樂", "時尚", "生活", "社會", "國際", "財經", "地產", "政治", "論壇"];
var resultData = [];


init();
crawler(1, 5);

// initial Output Object
function init() {
    categories.forEach(function(element) {
        var obj = {
            "category": element,
            "news_count": 0,
            "news": []
        };
        resultData.push(obj);
    });
}

function crawler(from, end) {
    var tasks = [];

    for (var i = from; i <= end; i++) {
        tasks.push(crawlPage(URL + 'i'));
    }

    //Use Q to promise every crawler done
    Q.all(tasks).done(function() {
        saveResult(resultData);
        var Max = getMax(resultData);
        var date = new Date();
        console.log(date.getFullYear() + '/' + date.getMonth() + '/' + date.getDay() + " " + date.getHours() + ":" + date.getMinutes() + "新聞數量最多的分類為為 [" + Max.category + "] ，共有 " + Max.news_count + " 則新聞");
    });
}

function crawlPage(targetURL) {
    //make the promise
    var deferred = Q.defer();
    request(targetURL, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);

            // address every data of news
            $('ul.rtddd>li').each(function(i, element) {
                var item = $(element).find('a');

                var category = item.find('h2').text();
                var title = item.find('h1').text();
                var url = Domain + item.attr('href');
                var time = item.find('time').text();
                var video = item.hasClass('hsv') ? true : false;

                var item = {
                    'title': title,
                    'url': url,
                    'time': time,
                    'video': video
                };
                // search category and save item data
                var targetCategory = resultData.filter(function(element) {
                    return element.category == category;
                });
                targetCategory[0].news_count++;
                targetCategory[0].news.push(item);
            });
        }
        //talk to others crawler done
        deferred.resolve();
    });

    return deferred.promise;
};

// filter max amount of news category
function getMax(resultData) {
    return resultData.reduce(function(previousObj, currentObj) {
        if (previousObj.news_count < currentObj.news_count) {
            return currentObj;
        } else {
            return previousObj;
        }
    });
}

// turn data to string and write to file
function saveResult(data) {
    var text = JSON.stringify(data);
    fs.writeFile('appledaily.json', text, function(err, data) {
        if (err) {
            return console.log(err);
        }
    });
}