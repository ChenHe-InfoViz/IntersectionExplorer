//    var RecXML;
//    var xhttp = new XMLHttpRequest();
//    xhttp.onreadystatechange = function() {
//        if (xhttp.readyState == 4 && xhttp.status == 200) {
//            RecXML = xhttp.responseXML;
//            document.getElementById("demo").innerHTML =
//                    RecXML.getElementsByTagName("contentID")[0].childNodes[0].nodeValue;
//            //myFunction(xhttp);
//        }
//    }
//    xhttp.open("GET", "rec.xml", true);
//    xhttp.send();
function dataParser(callback) {

    this.JSONObject = {};
    this.csvContent = "";
    this.currentUserBookmarks = [];
    this.UserAndBookmarks = [];
    this.commonCount = {};
    var currentUserID = globalUserId.toString();
    var currentUserName = globalname.toString();
    var self = this;
    var PaperXml;
    var SimilarUserXml;
    var BookmarkXml;
    var TagXml;
    var RecXml;
    var contentRecJSON;
    var tagRecJSON;
    var bibliJSON;
    var topJSON;
    var externalRecJSON;
    var bibliDefer = $.Deferred();
    var bookmarkDefer = $.Deferred();
    var contentDefer = $.Deferred();
    var tagRecDefer = $.Deferred();
    var tagDefer = $.Deferred();
    var paperDefer = $.Deferred();
    var externalDefer = $.Deferred();
    var topDefer = $.Deferred();
    jQuery.support.cors = true;
    var paperRequestTimes = 0;
    var tagRequestTimes = 0;
    var bookmarkRequestTimes = 0;
    var tagRecRequestTimes = 0;
    var bookmarkRecRequestTimes = 0;
    var bibliRequestTimes = 0;
    var topRequestTimes = 0;
    var extRequestTimes = 0;

    paperRequestLoop();

    function processRequest() {
        PaperXml = makeCorsRequest('http://halley.exp.sis.pitt.edu/cn3/xml/content_ECTEL2015.xml');
        SimilarUserXml = makeCorsRequest('http://halley.exp.sis.pitt.edu/cn3/xml/neighborhood.xml.php?conferenceID=137&limit=15&userID=16');
        BookmarkXml = makeCorsRequest('http://halley.exp.sis.pitt.edu/cn3/xml/scheduling.xml.php?conferenceID=137');
        TagXml = makeCorsRequest('http://halley.exp.sis.pitt.edu/cn3/xml/tagging.xml.php?conferenceID=137');
        RecXml = makeCorsRequest('http://halley.exp.sis.pitt.edu/cn3mobile/bM25SysRec.jsp?conferenceID=137&userID=16');
        success();
    }

    //processRequest();

//user this to wait for all the requests end
//    $.when(paperDefer, bookmarkDefer, tagDefer, tagRecDefer, bibliDefer, externalDefer, contentDefer, topDefer)//paperRequest,  tagRecRequest, contentRecRequest, bibliRec, externalRec, bookmarkReqeust, tagRequest)
//        .done(success);
    function success() {
        //console.log($(PaperXml).find('RECORD').length);
        //console.log($(SimilarUserXml).find('RECORD').length);
        //console.log($(BookmarkXml).find('RECORD').length);
        //console.log($(TagXml).find('RECORD').length);
        //console.log($(RecXml).find('Item').length);

        var $paperXml = $(PaperXml);
        //var $similarUserXml = $(SimilarUserXml);
        var $bookmarkXml = $(BookmarkXml);
        var $tagXml = $(TagXml);
        //var $recXml = $(RecXml);
        //var $tagRecXml = $(tagRecXml);

        var paperDetail = [];
        var similarUsers = []; // user id and name
        var userDetail = [];
        var userBookmarks = [];
        var tagsArray = [];
        var tagsCount = {};
        var paperIDTags = [];
        //var rec = []; //paper Id for recommendation
        var contentRec = [];
        var tagRec = [];
        var bibliRec = [];
        var externalRec = [];
        var topRec = [];
        var userBookmarkCount = {};
        var countPaper = 0;
        $paperXml.find('RECORD').each(function () {
            var contentID;
            var presentationID;
            var title;
            var authors;
            contentID = $(this).find('contentID').text();
            title = $(this).find('title').text();
            presentationID = $(this).find('presentationID').text();
            authors = $(this).find('author_list').text();

            //$(this).find('field').each(function () {
            //    if ($(this).attr('name') == 'contentID')
            //        contentID = $(this).text();
            //    else if ($(this).attr('name') == 'title')
            //        title = $(this).text();
            //    else if ($(this).attr('name') == 'presentationID')
            //        presentationID = $(this).text();
            //    else if ($(this).attr('name') == 'author_list')
            //        authors = $(this).text();
            //})

            //console.log(contentID);
            paperDetail.push({
                contentID: contentID,
                presentationID: presentationID,
                title: title,
                authors: authors
            });
            countPaper++;
        });
        //console.log(countPaper);
        //$similarUserXml.find('RECORD').each(function () {
        //    var userID = $(this).find('neighbor').text();
        //    var userName = $(this).find('name').text();
        //
        //    //console.log(userName);
        //    similarUsers.push({
        //        userID: userID,
        //        userName: userName
        //    });
        //});
//
//
        var allUserWithBookmark = []; //also put current user inside
        if (allUserWithBookmark.indexOf(currentUserID) == -1) {
            userDetail.push({
                userID: currentUserID,
                userName: currentUserName
            });
            allUserWithBookmark.push(currentUserID);
            var newList = [];
            self.UserAndBookmarks.push({
                userID: currentUserID,
                userName: currentUserName,
                setID: "",
                bookmarks: newList
            });
            userBookmarkCount[currentUserID] = 0;
            self.commonCount[currentUserID] = 0;
        }

        $bookmarkXml.find('RECORD').each(function () {
            var contentID = $(this).find('contentID').text();
            var userID = $(this).find('userID').text();
            var userName = $(this).find('strUserID').text();

            if (allUserWithBookmark.indexOf(userID) == -1) {
                userDetail.push({
                    userID: userID,
                    userName: userName
                });
                //console.log("da" + userName + userID);
                allUserWithBookmark.push(userID);
                var newList = [];
                newList.push(contentID);
                self.UserAndBookmarks.push({
                    userID: userID,
                    userName: userName,
                    setID: "",
                    bookmarks: newList
                });
                userBookmarkCount[userID] = 1;
                self.commonCount[userID] = 0;
                //console.log(userID);
            }
            else {
                userBookmarkCount[userID]++;
                var k = 0;
                for (; k < self.UserAndBookmarks.length; k++) {
                    if (self.UserAndBookmarks[k]['userID'] == userID)
                        break;
                }
                self.UserAndBookmarks[k]['bookmarks'].push(contentID);
            }

            if(userID == currentUserID){
                self.currentUserBookmarks.push(contentID);
            }

            var j = 0;
            for (; j < userBookmarks.length; j++) {
                if (userBookmarks[j]['contentID'] == contentID)
                    break;
            }
            //console.log(userName + " " + contentID);
            if (j < userBookmarks.length)
                userBookmarks[j]['userIDList'].push(userID);
            else {
                var newArray = [];
                newArray.push(userID);
                userBookmarks.push({
                    userIDList: newArray,
                    contentID: contentID
                });
            }
        });

        //calculate common bookmarks
        for(k = 0; k < self.UserAndBookmarks.length; k++){
            var count = 0;
            var list = self.UserAndBookmarks[k]['bookmarks'];
            for(m = 0;m < list.length; m++){
                if(self.currentUserBookmarks.indexOf(list[m]) > -1)
                    count++;
            }
            self.commonCount[self.UserAndBookmarks[k]['userID']] = count;
        }

        //sort userDetail by user last name or bookmark count
        //similarUsers.sort(function (a, b) {
        //    //var alist = a.userName.split(" ");
        //    //var blist = b.userName.split(" ");
        //    //return alist[alist.length - 1].localeCompare(blist[blist.length - 1]);
        //    var acount, bcount;
        //    if(a.userID in userBookmarkCount)
        //        acount = userBookmarkCount[a.userID];
        //    else acount = 0;
        //    if(b.userID in userBookmarkCount)
        //        bcount = userBookmarkCount[b.userID];
        //    else bcount = 0;
        //    return bcount - acount;
        //
        //});

        //console.log(userBookmarkCount);
        //console.log(similarUsers);


//    for(i = 0; i < userBookmarks.length; i++)
//    {
//        console.log(userBookmarks[i]);
//    }

        //remove duplicates in an array
        Array.prototype.unique = function () {
            var o = {}, i, l = this.length, r = [];
            for (i = 0; i < l; i += 1) o[this[i]] = this[i];
            for (i in o) r.push(o[i]);
            return r;
        };

        $tagXml.find('RECORD').each(function () {
            var contentID = $(this).find('contentID').text();
            var tagList = $(this).find('tag_list').text();
            var tags = tagList.split("|");

            for (i = 0; i < tags.length; i++) {
                tags[i] = tags[i].replace(/(\r\n|\n|\r)/gm, "");
                tags[i] = tags[i].trim();
                //console.log("ttt" + tags[i]);
            }
            tags = tags.unique();
            var j;
            for(j = 0; j < paperIDTags.length; j++) {
                if(paperIDTags[j].contentID == contentID)
                    break;
            }

            if (j < paperIDTags.length) {
                for (i = 0; i < tags.length; i++) {
                    if(paperIDTags[j].tags.indexOf(tags[i]) < 0) {
                        paperIDTags[j].tags.push(tags[i]);
                        if(tagsCount.hasOwnProperty(tags[i])) {
                            tagsCount[tags[i]]++;
                            //console.log(tags[i]);
                        }
                        else {
                            tagsArray.push(tags[i]);
                            tagsCount[tags[i]] = 1;
                        }
                    }
                    //console.log("concat " + tags);
                }
            }
            else {
                for (i = 0; i < tags.length; i++) {
                    if (tagsCount.hasOwnProperty(tags[i]))
                        tagsCount[tags[i]]++;
                    else {
                        tagsCount[tags[i]] = 1;
                        tagsArray.push(tags[i]);
                    }
                }
                paperIDTags.push({
                    contentID: contentID,
                    tags: tags
                });
            }
        });

        //for (i = 0; i < paperIDTags.length; i++) {
        //    paperIDTags[i].tags = paperIDTags[i].tags.unique();
        //    //console.log("id: " + paperIDTags[i].contentID + "   " + paperIDTags[i].tags);
        //}

        //tagsArray = tagsArray.unique();
        tagsArray.sort();

        //$recXml.find('Item').each(function () {
        //    var contentID = $(this).find('contentID').text();
        //    //console.log(contentID);
        //    rec.push(contentID);
        //});

        //$contentRecXml.find('Item').each(function () {
        //    var contentID = $(this).find('contentID').text();
        //    //console.log(contentID);
        //    contentRec.push(contentID);
        //});
        try {
            //console.log(contentRecJSON);
            var ids = contentRecJSON.Results.Items[0].Item;
            for (i = 0; i < ids.length; i++) {
                //console.log(ids[i].contentID[0]);
                contentRec.push(ids[i].contentID[0]);
            }
        }
        catch(e){
            console.log("get content based recommendations failed." + e);
        }
        try{
            ids = tagRecJSON.Results.Items[0].Item;
            for(i = 0; i < ids.length; i++){
                //console.log(ids[i].contentID[0]);
                tagRec.push(ids[i].contentID[0]);
            }
        }
        catch(e){
            console.log("get tag based recommendations failed." + e);
        }
        try{
            ids = topJSON.Results.Items[0].Item;
            for(i = 0; i < ids.length; i++){
                //console.log(ids[i].contentID[0]);
                topRec.push(ids[i].contentID[0]);
            }
        }
        catch(e){
            console.log("get top recommendations failed." + e);
        }
        try{
            ids = bibliJSON.Results.Items[0].Item;
            for(i = 0; i < ids.length; i++){
                //console.log(ids[i].contentID[0]);
                bibliRec.push(ids[i].contentID[0]);
            }
        }
        catch(e){
            console.log("get bibli recommendations failed." + e);
        }
        try{
            ids = externalRecJSON.Results.Items[0].Item;
            for(i = 0; i < ids.length; i++){
                //console.log(ids[i].contentID[0]);
                externalRec.push(ids[i].contentID[0]);
            }

        }
        catch(e){
            console.log("get external recommendations failed." + e);
        }

        //sort userDetail by user name or bookmark quantity
        userDetail.sort(function (a, b) {
            //var alist = a.userName.split(" ");
            //var blist = b.userName.split(" ");
            //return alist[alist.length - 1].localeCompare(blist[blist.length - 1]);
            //
            if(self.commonCount[b.userID] == self.commonCount[a.userID])
                return userBookmarkCount[b.userID] - userBookmarkCount[a.userID];
            return self.commonCount[b.userID] - self.commonCount[a.userID];
        });

        var start = 0;
        //userDetail.forEach(function(a){console.log(a.userName)});
        //write to csv file
        self.csvContent += "name;presentationID;title;authors;";
        if(topRec.length > 0) {
            self.csvContent += "top-10 agent (" + topRec.length + ");";
            start++;
        }
        if(tagRec.length > 0) {
            self.csvContent += "tag-based agent (" + tagRec.length + ");";
            start++;
        }
        if(contentRec.length > 0) {
            self.csvContent += "bookmark-based agent (" + contentRec.length + ");";
            start++;
        }
        if(bibliRec.length > 0) {
            self.csvContent += "bibliography agent (" + bibliRec.length + ");";
            start++;
        }
        if(externalRec.length > 0) {
            self.csvContent += "ext. bookmarks agent (" + externalRec.length + ");";
            start++;
        }
        //tag-based agent (10);bookmark-based agent (10);bibliography agent (10);ext. bookmarks agent (10);";
        //store user id list
        var userIDArray = [];
        var index = 3 + start;

        //myObject.file = "";
        self.JSONObject.name = "IUI2016 Exploration";
        self.JSONObject.header = 0;
        self.JSONObject.separator = ";";
        self.JSONObject.skip = 0;
        self.JSONObject.meta = [];
        self.JSONObject.meta.push({
            "type": "id",
            "index": 0,
            "name": "name"
        });
        self.JSONObject.meta.push({
            "type": "string",
            "index": 1,
            "name": "presentationID"
        });
        self.JSONObject.meta.push({
            "type": "string",
            "index": 2,
            "name": "Title"
        });
        self.JSONObject.meta.push({
            "type": "authorString",
            "index": 3,
            "name": "Authors"
        });
        self.JSONObject.sets = [];
        self.JSONObject.sets.push({
            "name": "Agents (number of papers)",
            "format": "binary",
            "start": 4,
            "end": index
        });


        //for (i = 0; i < similarUsers.length; i++) {
        //    if(similarUsers[i].userID in userBookmarkCount){
        //    //if(allUserWithBookmark.indexOf(similarUsers[i].userID) > -1){
        //    self.csvContent += similarUsers[i].userName + " (" + userBookmarkCount[similarUsers[i].userID] + ");";
        //    userIDArray.push(similarUsers[i].userID);
        //        index++;
        //    }
        //    //similar users without bookmark
        //    //else {
        //    //    self.csvContent += similarUsers[i].userName + " (0);";
        //    //    userIDArray.push(similarUsers[i].userID);
        //    //    index++;
        //    //}
        //}
        //
        //self.JSONObject.sets.push({
        //    "name": "Similar users (number of bookmarks)",
        //    "format": "binary",
        //    "start": 8,
        //    "end": index
        //});

        start = index + 1;
        for (i = 0; i < userDetail.length; i++) {
            //var result = $.grep(similarUsers, function (e) {
            //    return e.userID == userDetail[i].userID;
            //});
            //user that not exist in similar user list
            //if (userIDArray.indexOf(userDetail[i].userID) < 0) {
                userIDArray.push(userDetail[i].userID);
            //console.log(userDetail[i].userName);
                self.csvContent += userDetail[i].userName + " (" + self.commonCount[userDetail[i].userID] + '/' + userBookmarkCount[userDetail[i].userID] + ");";
                index++;
            //}
        }
        self.JSONObject.sets.push({
            "name": "Users (common bookmarks/total bookmarks)",
            "format": "binary",
            "start": start,
            "end": index
        });
        start = index + 1;

        for (i = 0; i < tagsArray.length; i++) {
            self.csvContent += tagsArray[i] + " (" + tagsCount[tagsArray[i]] + ");";
            index++;
        }
        self.JSONObject.sets.push({
            "name": "Tags (number of related papers)",
            "format": "binary",
            "start": start,
            "end": index
        });

        self.csvContent += "\n";
        //console.log("lengthlengthlength:" + userIDArray.length);
        for (i = 0; i < paperDetail.length; i++) {
            var contentID = paperDetail[i].contentID;
            self.csvContent += paperDetail[i].contentID + ";";
            self.csvContent += paperDetail[i].presentationID + ";";
            self.csvContent += paperDetail[i].title + ";";
            self.csvContent += paperDetail[i].authors + ";";

            if(topRec.length > 0)
                if (topRec.indexOf(contentID) > -1)
                    self.csvContent += "1;";
                else self.csvContent += "0;";

            if(tagRec.length > 0)
            if (tagRec.indexOf(contentID) > -1)
                self.csvContent += "1;";
            else self.csvContent += "0;";

            if(contentRec.length > 0)
            if (contentRec.indexOf(contentID) > -1)
                self.csvContent += "1;";
            else self.csvContent += "0;";

            if(bibliRec.length > 0)
            if (bibliRec.indexOf(contentID) > -1)
                self.csvContent += "1;";
            else self.csvContent += "0;";

            if(externalRec.length > 0)
            if (externalRec.indexOf(contentID) > -1)
                self.csvContent += "1;";
            else self.csvContent += "0;";

            var result = $.grep(userBookmarks, function (e) {
                return e.contentID == contentID;
            });

            if (result.length == 0) {
                console.log(contentID + "has no bookmarks");
                for (j = 0; j < userIDArray.length; j++) {
                    self.csvContent += "0;";
                }
            }
            else {
                var currentBookmarks = result[0].userIDList;
                //console.log(currentBookmarks);
                for (j = 0; j < userIDArray.length; j++) {
                    //console.log(j +  userIDArray[j]);
                    if (currentBookmarks.indexOf(userIDArray[j]) > -1) {
                        self.csvContent += "1;";
                        //console.log("bookmarked by " + userIDArray[j]);
                    }
                    else self.csvContent += "0;";
                }
            }

            result = $.grep(paperIDTags, function (e) {
                return e.contentID == contentID;
            });

            if (result.length == 0) {
                console.log(contentID + "has no tag");
                for (j = 0; j < tagsArray.length; j++) {
                    self.csvContent += "0;";
                }
            }
            else {
                var oneTagList = result[0].tags;
                for (j = 0; j < tagsArray.length; j++) {
                    if (oneTagList.indexOf(tagsArray[j]) > -1) {
                        //console.log(tagsArray[j]);
                        self.csvContent += "1;";
                    }
                    else self.csvContent += "0;";
                }
            }
            self.csvContent += "\n";
        }
        //self.csvContent = "data:text/csv;charset=utf-8," + self.csvContent;
        //
        //var encodedUri = encodeURI(self.csvContent);
        //window.open(encodedUri);
        //var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(self.JSONObject));
        //window.open(data);
        callback();
    }

    function fail() {
        console.log('fail');
    }


    function paperRequestLoop()
    {
        paperRequestTimes++;
        if(paperRequestTimes < 5) {
            paperRequest = $.ajax({
                type: "POST",
                url: "proceedings",
                //dataType: "json",
                contentType: 'text/xml',
                success: function (response) {
                    try {
                        //recXml = recXml.replace(/(\r\n|\n|\r|\t)/gm, '');
                        //contentRecXml = $.parseXML(recXml);
                        //externalRecJSON = response;

                        //console.log(bookmarkXml);
                        //paperXml = paperXml.replace(/\t/g, '');
                        PaperXml = response;
                        //PaperXml = $.parseXML(response);

                    }
                    catch (e) {
                        console.log("proceedings error");

                    }
                    userReuqestLoop();
                },
                error: function () {
                    console.log("get paper list failed.");
                    paperRequestLoop();
                },
                timeout: 5000
            }).complete(paperDefer.resolve);
        }
        else userReuqestLoop();
    }

    function userReuqestLoop(){
        bookmarkRequestTimes++;
        if(bookmarkRecRequestTimes < 5) {
            bookmarkRequest = $.ajax({
                type: "POST",
                url: "bookmarks",
                //url: "http://halley.exp.sis.pitt.edu/cn3/xml/scheduling.xml.php?conferenceID=137"+ "&timestamp=" + new Date(),
                contentType: 'text/xml',
                success: function (bookmarkXml) {
                    try {
                        BookmarkXml = bookmarkXml;
                    }
                    catch (e) {
                        console.log(e);
                    }
                    tagRequestLoop()
                },
                error: function () {
                    console.log("get bookmark failed.");
                    userReuqestLoop();
                },
                timeout: 5000
            }).complete(bookmarkDefer.resolve);
        }
        else tagRequestLoop()
    }

    function tagRequestLoop(){
        tagRequestTimes++;
        if(tagRequestTimes < 5) {
            tagRequest = $.ajax({
                type: "POST",
                url: "tags",
                //url: "http://halley.exp.sis.pitt.edu/cn3/xml/tagging.xml.php?conferenceID=137"+ "&timestamp=" + new Date(),
                contentType: 'text/xml',
                success: function (tagXml) {
                    try {
                        //tagXml = tagXml.replace(/\t/g, '');
                        //TagXml = $.parseXML(tagXml);
                        TagXml = tagXml
                    }
                    catch (e) {
                        console.log("tag error");
                    }
                    topRequestLoop();
                },
                error: function () {
                    console.log("get tag failed.");
                    tagRequestLoop();
                },
                timeout: 5000
            }).complete(tagDefer.resolve);
        }
        else topRequestLoop()

    }

    function topRequestLoop(){
        topRequestTimes++;
        if(topRequestTimes < 5) {
            topRec = $.ajax({
                type: "POST",
                url: "top",
                //data: JSON.stringify({userid: currentUserID}),
                //dataType: "json",
                contentType: 'application/json',
                success: function (response) {
                    try {
                        //recXml = recXml.replace(/(\r\n|\n|\r|\t)/gm, '');
                        //contentRecXml = $.parseXML(recXml);
                        topJSON = response;
                    }
                    catch (e) {
                        console.log("top rec error");
                    }
                    tagRecRequestLoop()
                },
                error: function () {
                    console.log("get top rec failed.");
                    topRequestLoop();
                },
                timeout: 5000
            }).complete(topDefer.resolve);
        }
        else tagRecRequestLoop()
    }

    function tagRecRequestLoop(){
        tagRecRequestTimes++;
        if(tagRecRequestTimes < 5) {
            tagRecRequest = $.ajax({
                type: "POST",
                url: "tagbased",
                data: JSON.stringify({userid: currentUserID}),
                dataType: "json",
                contentType: 'application/json',
                success: function (recXml) {
                    try {
                        tagRecJSON = recXml;
                    }
                    catch (e) {
                        console.log("rec error");
                    }
                    bookmarkRecRequestLoop();
                },
                error: function () {
                    console.log("get tag rec failed.");
                    tagRecRequestLoop();
                },
                timeout: 5000
            }).complete(tagRecDefer.resolve);
        }
        else bookmarkRecRequestLoop();
    }

    function bookmarkRecRequestLoop(){
        bookmarkRecRequestTimes++;
        if(bookmarkRecRequestTimes < 5) {
            contentRecRequest = $.ajax({
                type: "POST",
                url: "contentbased",
                data: JSON.stringify({userid: currentUserID}),
                dataType: "json",
                contentType: 'application/json',
                success: function (response) {
                    try {
                        //recXml = recXml.replace(/(\r\n|\n|\r|\t)/gm, '');
                        //contentRecXml = $.parseXML(recXml);
                        contentRecJSON = response;
                    }
                    catch (e) {
                        console.log("rec error");
                    }
                    extRequestLoop()
                },
                error: function () {
                    console.log("get bookmark rec failed.");
                    bookmarkRecRequestLoop();
                },
                timeout: 5000
            }).complete(contentDefer.resolve);
        }
        else extRequestLoop()
    }

    function extRequestLoop(){
        extRequestTimes++;
        if(extRequestTimes < 5) {
            externalRec = $.ajax({
                type: "POST",
                url: "external",
                data: JSON.stringify({userid: currentUserID}),
                dataType: "json",
                contentType: 'application/json',
                success: function (response) {
                    try {
                        //recXml = recXml.replace(/(\r\n|\n|\r|\t)/gm, '');
                        //contentRecXml = $.parseXML(recXml);
                        externalRecJSON = response;
                    }
                    catch (e) {
                        console.log("external rec error");
                    }
                    bibliRequestLoop()
                },
                error: function () {
                    console.log("get ext failed.");
                    extRequestLoop();
                },
                timeout: 5000
            }).complete(externalDefer.resolve);
        }
        else bibliRequestLoop()
    }

    function bibliRequestLoop(){
        bibliRequestTimes++;
        if(bibliRequestTimes < 5) {
            bibliRec = $.ajax({
                type: "POST",
                url: "bibli",
                data: JSON.stringify({userid: currentUserID}),
                dataType: "json",
                contentType: 'application/json',
                success: function (response) {
                    try {
                        //recXml = recXml.replace(/(\r\n|\n|\r|\t)/gm, '');
                        //contentRecXml = $.parseXML(recXml);
                        bibliJSON = response;
                    }
                    catch (e) {
                        console.log("bibli error");
                    }
                    success()
                },
                error: function () {
                    console.log("get bibli failed.");
                    bibliRequestLoop();
                },
                timeout: 5000
            }).complete(bibliDefer.resolve);
        }
        else success()
    }
}


