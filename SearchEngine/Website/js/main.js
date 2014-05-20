// Function: Document ready
$(document).ready(function() {
    console.log("Document ready!");
    
    // Clear #results
    window.location.href='#';
    
    // Function called when the window is resized or loaded
    // This code resizes the search bar to always fit the screen
    $(window).on("resize load", function () {
        // If width of window is LESS 640px, we set the search bar's width to 100% of screen instead of 610px
        if ($(window).width() <= 640) {
            $('#searchBarContainer').width('96%');
            $('#searchBarContainer').css('margin', '0 auto');
        } else {
            // If width of window is GREATER than 640px, we set the search bar's width to 610px
            $('#searchBarContainer').width(610);
            $('#searchBarContainer').css('margin', '0 auto');
        }
    });
    
    // Function called when we change #example to #anotherExample
    // This code is used to show/hide results page
    $(window).on('hashchange',function() {
        // Remove # symbol
        var hash = location.hash.substring(1);
        // If we're going to results
        if (hash == 'results') {
            // Overflow visible, so we can scroll in results list.
            $('body').css('overflow-y', 'visible');
            // Set margin of resultsPage to 0 (it was equal to screen size to hide it before)
            $("#resultsPage").animate({'marginTop':"0"});
        } else if ( hash == '') {
            // Overflow hidden, so we cant scroll to results page when its off-screen.
            $('body').css('overflow-y', 'hidden');
            // Set margin of resultsPage to 100vh (screen size) to push it off screen and hide it
            $("#resultsPage").animate({'marginTop':"100vh"});
        }        
    });
    
    // ## Get stats
    $.getJSON("/api/stats", function(data) {
        // Get pages count, and insert thousands separators
        var pages = data.indices.webpages.total.docs.count;
        // Size of index
        var size = data.indices.webpages.total.store.size;
        console.log("Index size: " + pages + " pages (" + size + ")");
        $("#searchInput").attr("placeholder", "Search more than " + Math.round(pages/1000) + " thousand webpages");
    });
    
    // #### SEARCH EVENTS ####
    // ## Main Page
    // Event: Enter button pressed in search field (main page)
    $('#searchInput').keydown(function(event) {
        if (event.keyCode == 13) {
            // Simulate clicking on the "search" button
           $('#searchButton').trigger('click');
        }
    });
    // Event: Search button pressed (main page)
    $("#searchButton").click(function() {
        // Get user input from search field
        var query = $("#searchInput").val();
        
        // Set the query to the search input box on the results page
        $("#resultsPage_searchInput").val(query);
        
        // Search
        search(query);
        
        // Set URL to #result (move view to results page)
        window.location.href='#results';
        
        // Clear search box on main page
        $("#searchInput").val('');
    });
    
    // ## Result page
    // Event: Enter button pressed in search field (results page)
    $('#resultsPage_searchInput').keydown(function(event) {
        if (event.keyCode == 13) {
            // Simulate clicking on the "search" button
           $('#resultsPage_searchButton').trigger('click');
        }
    });
    // Event: Search button pressed (results page)
    $('#resultsPage_searchButton').click(function() {
        // Get user input from search field
        var query = $("#resultsPage_searchInput").val();
                
        // Search
        search(query);
    });
    
    // #### Add Your Site ####
    $('#addYourSite-goButton').click(function() {
        // Get user input from input field
        var site = $("#addYourSite-input").val();
                
        // Send site to server for indexing
        $.getJSON("/api/add", {site: site}, function(data) {
            console.log("Add site status:");
            console.log(data);
        });
    });
});

function search(query) {
    console.log(query);
    // Clear search results
    $("#resultsPage_results").html("");
    
    // Send search request to server using AJAX
    $.getJSON("/api/search", {q: query}, function(data) {
        $("#resultsPage_stats").text(data.hits + " results");
        
        // ## Search results
        // Loop through the results (If we have any)
        if (data.hits) {
            $.each(data.results, function(index, result) {
                // Add result to page
                $("#resultsPage_results").append('<div class="panel panel-default result">\
                                                    <div class="panel-body">\
                                                        <h3><a href="'+result.url+'">'+result.title+'</a></h3>\
                                                        <p class="result_link">'+result.url+'</p>\
                                                        <p>'+result.description+'</p>\
                                                    </div>\
                                                </div>');
            });
        } else {
            $("#resultsPage_results").html('<h3>No results, sorry!</h3>');
        }
        
        
        // ## Freebase
        // If we got some Freebase info
        if (data.freebase) {
            // Show the Freebase panel
            $("#resultsPage_freebase").show();
            // Insert values
            $("#freebase_title").html(data.freebase.name);
            $("#freebase_text").html(data.freebase.description);
            $("#freebase_source").text(data.freebase.provider);
            $("#freebase_source").attr("href", data.freebase.provider_url);
        } else {
            // If no Freebase, hide the Freebase panel
            $("#resultsPage_freebase").hide();
        }
    });
};