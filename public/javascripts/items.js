function plotSelectionTabs( element, selections, activeSelection ) {
    // clear target element
    d3.select(element).html("");

    if ( selections.getSize() <= 0 ) {
        d3.select(element).append('div' )
            .attr( 'class', 'info-message' )
            .html( 'No queries. Click <i class="fa fw fa-plus"></i> button to add a new query.' );

        d3.select('#filters-list').html("");
        d3.select('#filters-list').append( "div" ).attr( "class", "info-message" ).html( 'No active selection.' );
        d3.select('#filters-controls').html("");
    }
    else {
        var table = d3.select(element)
            .append("table")
            .attr("class", "selection-tab-list");

        var tbody = table.append("tbody");

        var tabs = tbody.append("tr")
                .selectAll("td")
                .data(selections.list)
            .enter()
                .append("td")
                    .attr("class", "selection-tab")
                    .classed( { 'active': function(d,i) { return ( selections.isActive(d) ); } } )
                    .on("click", function(k) { // is attribute object
                        // check if selection has been deleted or not
                        if ( selections.getSelectionFromUuid( k.id ) ) {
                            selections.setActive( k );
                        }
                    });

                tabs.append("i")
                    .attr( "class", "fa fa-square" )
                    .style("color", function(d,i) { return ( selections.getColor( d ) ); } )
                    .style( "margin-right", "2px");
                tabs.append("span")
                    .text(function(d) { return d3.format("5d")( d.items.length ); });
                tabs.append("i")
                    .attr( "class", "fa fa-times-circle" )
                    .style( "margin-left", "5px")
                    .on("click", function(k) { // is attribute object
                        //selections.removeSelection( k );
                    });
    }



    d3.select('#selection-controls').html("");
    d3.select('#selection-controls')
        .append('div')
        .attr('class', 'selection-button level-1-button')
        .attr('title', 'Create element query' )
        .html('<i class="fa fw fa-plus"></i>')
        .on("click", function(event){
            createInitialSelection();
        });                    
}

//render query results...........
function plotSelectedItems( elementId, selection ) { 

    var element = d3.select(elementId);
    // clear target element
    element.html("");

    if ( !selection || selections.getSize() === 0 || !selections.getColor( selection ) ) {
        element.append( "div" ).attr( "class", "info-message" ).html( 'No active selection.' );
        return;
    }

    //d3.select(element).html('<p>' + selection.items.length + ' of ' + depth + ' selected</p>')

    /*
    for ( var i = 0; i < selection.filters.length; ++i ) {
        filter.renderViewer(element, selection, selection.filters[i].uuid );
    }
    */
    selection.filterCollection.renderController(d3.select("filters-controller"));
    
    var table = element.append("table").attr("id", "result-table");
    var thead = table.append("thead").attr("id", "result-thead");
    var tbody = table.append("tbody").style("overflow-y", 'auto').style("height", "100%").style("display", "block");

    var selectionColor = parseInt( selections.getColor( selection ).substring(1), 16 );
    //console.log( selectionColor + " --- " + selections.getColor( selection ) + " --- " + ( ( selectionColor << 24 ) >>> 24 ).toString(16) );
    //console.log( 'rgba(' + ( ( ( selectionColor << 8 ) >> 24 ) >>>0 ) + ',' + ( ( ( selectionColor << 16 ) >> 24 ) >>> 0 ) + ',' + ( ( ( selectionColor << 24 ) >> 24 ) >>> 0 ) + ', 0.25)' );

    thead.append("tr").style("display", "flex").style("width", "100%")
            .selectAll("th")
            .data(attributes.slice(2,attributes.length-1)) // don't show set column
        .enter()
            .append("th")
                .style("background-color", selections.getColor(selection))
        //'rgba(' + ( ( ( selectionColor << 8 ) >> 24 ) >>>0 ) + ',' + ( ( ( selectionColor << 16 ) >> 24 ) >>> 0 ) + ',' + ( ( selectionColor << 24 ) >>> 24 ) + ', 0.5)' )
                //.style("border-bottom", "3px solid " + selections.getColor( selection ) )
                .attr("class", "item-table-header").each(function(d,i){
            if(i == attributes.length - 4){
                d3.select(this).attr('width', '20%')
            }
            else d3.select(this).attr('width', '40%')
        })
                .text(function(d) { return d.name; })
                .on("click", function(k) { // is attribute object
                    d3.select(this).html( ( k.sort > 0 ? "&#x25B2;" : "&#x25BC;" ) + " " + k.name );
                    rows.sort( function(a, b) { 
                        switch ( k.type ) {
                            case 'integer':
                                // fall-through
                            case 'float':
                                return k.sort * ( k.values[a] - k.values[b] );
                            case 'authorString':
                                var authorsA = k.values[a].split(',');
                                //console.log(authorsA);
                                var authorsB = k.values[b].split(',');
                                //console.log(authorsB);
                                if(authorsA.length > 0 && authorsB.length > 0)
                                {
                                    authorsA = authorsA[0].split(' ');
                                    authorsB = authorsB[0].split(' ');
                                    if ( authorsA[authorsA.length-1] < authorsB[authorsB.length-1] ) {
                                        return k.sort * -1;
                                    }
                                    if ( authorsA[authorsA.length-1] > authorsB[authorsB.length-1] ) {
                                        return k.sort * 1;
                                    }

                                    return 0;
                                }
                                return 0;
                            case 'id':
                                // fall-through
                            case 'string':
                                // fall-through
                            default:
                                if ( k.values[a] < k.values[b] ) {
                                    return k.sort * -1;
                                }
                                if ( k.values[a] > k.values[b] ) {
                                    return k.sort * 1;
                                }
                                
                                return 0;
                        }
                    });
                    // switch sort order
                    k.sort = k.sort * -1;
                });

    var rows = tbody.selectAll("tr")
            .data(selection.items.slice(0,100)).enter()
            .append("tr").style("display", "flex").style("width", "100%")
            .each(function(d,i) {
            var attributeForItem = d3.select(this).selectAll("td")
                .data(attributes.slice(2,attributes.length-1)).enter()
                    .append("td").each(function(c, j){
                    if(j == attributes.length - 4){
                        d3.select(this).attr("width", "20%");
                    }
                    else d3.select(this).attr("width", "40%");

                    if(j == 0) //title
                    {
                        d3.select(this).append("a")
                            .style({
                                'cursor':'pointer',
                                'text-decoration': 'underline'
                            })
                            //.attr("onclick", "_blank") //set the link to open in an unnamed tab
                            //.attr("show", "new")
                            //.attr("href", function (b) {
                            //    return "http://halley.exp.sis.pitt.edu/cn3/presentation2.php?conferenceID=137&presentationID=" + attributes[1].values[selection.items[i]]; //create url from data
                            //})
                            .on("click", function(){
                                d3.select(this).style("color", "#4b2f89");
                                var $dialog = $('<div></div>')
                                    .html('<iframe style="border: 0px;" src="'+ "http://halley.exp.sis.pitt.edu/cn3/presentation2.php?conferenceID=139&presentationID=" + attributes[1].values[selection.items[i]] + '" width="100%" height="100%"></iframe>')
                                    .dialog({
                                        autoOpen: false,
                                        modal: true,
                                        height: 1200,
                                        width: 1200,
                                        title: attributes[2].values[selection.items[i]]
                                    });
                                $dialog.dialog('open');

                                var date = new Date();
                              userBehavior.push({type: 5, item: attributes[0].values[selection.items[i]],time: (date.getDate()<10?'0':'') + date.getDate()  + " @ " + (date.getHours()<10?'0':'') + date.getHours()  + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes()  + ":" + (date.getSeconds()<10?'0':'') + date.getSeconds()});
                                $(EventManager).trigger("user-behavior-added");
                            })
                            //Set the text within the link, which in this case is the only text
                            //within the text element.
                            .text(function (a) {
                                return a.values[selection.items[i]] ; //link text content
                            });
                    }
                    else if(j == attributes.length - 4) { //bookmark
                        if (dataForVis.currentUserBookmarks.indexOf(attributes[0].values[selection.items[i]]) > -1) {
                            d3.select(this).append("text").text("Bookmarked.");
                        }
                        else {
                            var a = d3.select(this).append("text");
                            a.style("cursor", "pointer")
                                .style("text-decoration", 'underline')
                                .style("color", "rgb(31, 119, 180)")
                                .on("click", function () {
                                    d3.select(this).on('click', null);
                                    $.ajax({
                                        type: "POST",
                                        url: "http://halley.exp.sis.pitt.edu/cn3/include/put2.php?method=schedulePresentation&userID=" + globalUserId + "&contentID=" + attributes[0].values[selection.items[i]],
                                        success: function (recXml) {
                                            document.getElementById("tipbar").innerHTML = "You bookmarked \"" + attributes[2].values[selection.items[i]] + "\" successfully! The set view has been updated as well. ";
                                            a.text("Bookmarked.")
                                                .style('color', 'black')
                                                .on('click', null)
                                                .style('text-decoration', 'none')
                                                .style('cursor', 'auto');
                                            dataForVis.currentUserBookmarks.push(attributes[0].values[selection.items[i]]);
                                            var date = new Date();
                                            userBehavior.push({
                                                type: 7,
                                                item: attributes[0].values[selection.items[i]],
                                                time: (date.getDate()<10?'0':'') + date.getDate()  + " @ " + (date.getHours()<10?'0':'') + date.getHours()  + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes()  + ":" + (date.getSeconds()<10?'0':'') + date.getSeconds()
                                            });
                                            $(EventManager).trigger("user-behavior-added");
                                            $(EventManager).trigger("refresh", [selection.items[i]]);
                                        },
                                        error: function () {
                                            a.text("Failed, please try again later.")
                                                .style("color", "red");
                                            setTimeout(function () {
                                                a.text("Bookmark this paper!");
                                            }, 2000);
                                            console.log("bookmark failed.");
                                        }
                                    });
                                })
                                .text("Bookmark this paper!");
                        }
                    }
                    else d3.select(this).text(function(a) { return a.values[selection.items[i]] });
                })
            });
}