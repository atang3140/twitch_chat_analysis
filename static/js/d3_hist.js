function drawHist(vod_num) {
    
    //console.log(vod_num);
    d3.selectAll("div")
        .remove();
    // set the dimensions and margins of the graph
    var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    var margin = { top: 10, right: 50, bottom: 30, left: 50 },
        width = windowWidth - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("body")
        .append("div")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
    // Its opacity is set to 0: we don't see it by default.
    var tooltip = d3.select("body")
        .append("div")
        .style("opacity", 1)
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("color", "white")
        //.style("border-radius", "5px")
        .style("padding", "2px")
        .html("마우스를 올려보세요!")

    // get the data
    //d3.csv('../static/tmp/' + vod_num + '.csv', function (data) {
    d3.csv('/static/download/' + vod_num + '.csv', function (data) {

        // X axis: scale and draw:
        var x = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.comment_time })])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Y axis: initialization
        var y = d3.scaleLinear()
            .range([height, 0]);
        var yAxis = svg.append("g")



        // A function that builds the graph for a specific value of bin
        function update(interval) {
            var max_x = d3.max(data, function (d) { return +d.comment_time });
            var arr = [];
            for (var i = 0; i < max_x; i += interval) {
                arr.push(i);
            }
            // set the parameters for the histogram
            var histogram = d3.histogram()
                .value(function (d) { return d.comment_time; })   // I need to give the vector of value
                .domain(x.domain())  // then the domain of the graphic
                .thresholds(arr); // then the numbers of bins
            // And apply this function to data to get the bins
            var bins = histogram(data);

            // Y axis: update now that we know the domain
            y.domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
            yAxis
                .call(d3.axisLeft(y));

            var color = "#69b3a2";
            // Join the rect with the bins data
            var u = svg.selectAll("rect")
                .data(bins)

            // Manage the existing bars and eventually the new ones:
            u
                .enter()
                .append("rect") // Add a new rect for each new elements
                .merge(u) // get the already existing elements as well
                .attr("data-select", 0)
                .attr("x", 1)
                .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
                .attr("width", function (d) { return x(d.x1) - x(d.x0); })
                .attr("height", function (d) { return height - y(d.length); })
                .style("fill", "#69b3a2")
                .on("mouseover", function (d) {
                    tooltip.html("[ " + sec2time(d.x0) + " - " + sec2time(d.x1) + " ] 동안 [ " + d.length + " ]번의 채팅이 있었습니다.")
                    if(d3.select(this).attr("data-select") == '0') {
                        d3.select(this).style("fill", "#FF8800");
                    }
                })
                .on("mouseleave", function () {
                    if(d3.select(this).attr("data-select") == '0') {
                        d3.select(this).style("fill", "#69b3a2"); 
                    }
                })
                .on("click", function (d) {
                    svg.selectAll("rect").attr("data-select", 0);
                    svg.selectAll("rect").style("fill", "#69b3a2");

                    d3.select(this).attr("data-select", 1);
                    d3.select(this).style("fill", "#FF0000"); 
                    changeURL(d.x0); 
                })


            // If less bar in the new histogram, I delete the ones not in use anymore
            u
                .exit()
                .remove()

        }

        // Initialize with 20 bins
        update(60)

        // Listen to the button -> update if user change it
        d3.select("#interval").on("input", function () {
            update(+this.value);
        });

    });
}

function sec2time(secNum) {
    h = parseInt(secNum / 3600);
    m = parseInt((secNum - h * 3600) / 60);
    s = secNum - h * 3600 - m * 60;
    return pad(h, 2) + 'h' + pad(m, 2) + 'm' + pad(s, 2) + 's';

    function pad(n, width) {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    }
}

function changeURL(secNum) {
    vod_num = document.getElementById('vod').dataset.num;
    timeStamp = sec2time(secNum);
    var iframe = document.getElementById('vod_frame').src = "https://player.twitch.tv/?autoplay=true&t=" + timeStamp + "&video=" + vod_num;
}

