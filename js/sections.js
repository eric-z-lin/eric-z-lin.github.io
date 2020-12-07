/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
function scrollVis(salesData, salesConfigs) {
    // constants to define the size
    // and margins of the vis area.
    var width = 600;
    var height = 520;
    var margin = { top: 30, left: 20, bottom: 40, right: 10 };

    // Keep track of which visualization
    // we are on and which was the last
    // index activated. When user scrolls
    // quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;

    // Sizing for the grid visualization
    var squareSize = 6;
    var squarePad = 2;
    var numPerRow = width / (squareSize + squarePad);

    // Sizing for the states grid visualization
    let map_squareSize = 42;
    let map_squarePad = 12;
    let map_numPerRow_initial = 5;

    // Salesline parameters
    let linepath = [];
    let line = [];
    // define scales and axes
    let x = d3.scaleTime()
        .range([50, width]);
    let y = d3.scaleLinear()
        .range([height, margin.top]);
    let xAxis = d3.axisBottom()
        .scale(x);
    let yAxis = d3.axisLeft()
        .scale(y);
    let salesDisplayData = salesData;
    let salesLineOn = false;

    // main svg used for visualization
    var svg = null;

    // d3 selection that will be used
    // for displaying visualizations
    var g = null;

    // We will set the domain when the
    // data is processed.
    // @v4 using new scale names
    var xBarScale = d3.scaleLinear()
        .range([0, width]);

    // The bar chart display is horizontal
    // so we can use an ordinal scale
    // to get width and y locations.
    // @v4 using new scale type
    var yBarScale = d3.scaleBand()
        .paddingInner(0.08)
        .domain([0, 1, 2])
        .range([0, height - 50], 0.1, 0.1);

    // Color is determined just by the index of the bars
    var barColors = { 0: '#EAA0A1', 1: '#FFDADC', 2: '#FFFFFF' };

    // @v4 using new scale name
    var xHistScale = d3.scaleLinear()
        .domain([0, 30])
        .range([0, width - 20]);

    // @v4 using new scale name
    var yHistScale = d3.scaleLinear()
        .range([height, 0]);



    // When scrolling to a new section
    // the activation function for that
    // section is called.
    var activateFunctions = [];
    // If a section has an update function
    // then it is called while scrolling
    // through the section with the current
    // progress through the section.
    var updateFunctions = [];

    let x_gdp, y_gdp;

    let tooltip_sales, tooltip_bars, tooltip_grid;

    /**
     * chart
     *
     * @param selection - the current d3 selection(s)
     *  to draw the visualization in. For this
     *  example, we will be drawing it in #vis
     */
    var chart = function (selection) {
        selection.each(function (rawData) {
            console.log('raw', rawData);
            // create svg and give it a width and height
            svg = d3.select(this).selectAll('svg').data([wordData]);
            var svgE = svg.enter().append('svg');
            // @v4 use merge to combine enter and existing selection
            svg = svg.merge(svgE);

            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            svg.append('g');

            // this group element will be used to contain all
            // other elements.
            g = svg.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // perform some preprocessing on raw data
            var wordData = getWords(rawData['wordData']);
            // filter to just include filler words
            var fillerWords = getFillerWords(wordData);

            // get the counts of filler words for the
            // bar chart display
            var fillerCounts = groupByWord(fillerWords);
            // set the bar scale's domain
            var countMax = d3.max(fillerCounts, function (d) { return d.value;});
            xBarScale.domain([0, countMax]);


            let salesData = rawData["salesData"];
            let configs = rawData["configs"];
            let gdpData = rawData["gdpData"];
            let statesMapData = rawData["statesMapData"];
            let usMapData = rawData["usMapData"];
            let censusData = rawData["censusData"];
            // let pppData = rawData["pppData"];
            pppData = [];

            svg.append("text")
                .attr("class", "y-axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 55)
                .attr("x", -30)
                .attr("dy", "1em")
                .style("opacity", "1")
                .style("text-anchor", "end")
                .style("font-size", "10px")
                .style("fill", "white")
                .text("Sales ($M)");

            setupVis(wordData, fillerCounts, salesData, configs, gdpData, statesMapData, usMapData, censusData, pppData);

            setupSections();
        });
    };

    function updateSalesLine(svg) {
        console.log(salesData);
        console.log(salesDisplayData);
        // update domains
        x.domain(d3.extent(salesDisplayData, d => d.month));
        y.domain([0, 110000])
        // draw lines
        tooltip_sales = d3.select("d3-tip-sales");
        salesConfigs.forEach(function (product, index) {
            line[index]
                .datum(salesDisplayData)
                // display product name when mouseover
                .on("mouseover", function (event, d) {
                    tooltip_sales
                        .style("left", event.x - 600 + "px")
                        .style("top", event.y - 150 + "px")
                        .style("visibility", "visible")
                        .html(product);
                })
                .on("mouseout", function () {
                    tooltip_sales.style("visibility", "hidden");
                })
                .transition()
                .duration(800)
                .attr("fill", "none")
                .attr("stroke-width", 3)
                .attr("stroke", "#EAA0A1")
                .attr("d", linepath[index]);
        })


        // update x axis
        svg.select(".x-axis")
            .transition()
            .duration(800)
            .call(xAxis);

        // update y axis
        svg.select(".y-axis")
            .transition()
            .duration(800)
            .call(yAxis);
    }

    function generateSalesLine(svg, data, configs) {
        // append axes
        svg.append("g")
            .attr("class", "x-axis axis")
            .attr("id", "sales-xaxis")
            .attr("transform", "translate(0," + height + ")");
        svg.append("g")
            .attr("class", "y-axis axis")
            .attr("id", "sales-yaxis")
            .attr("transform", "translate(50,0)");

        // create linepath and line arrays

        // iterate over configs to create linepaths and lines for each product
        configs.forEach(function(product, index) {
            linepath[index] = d3.line()
                .x(d => x(d.month))
                .y(d => y(d[product]));
            line[index] = svg.append("path")
                .attr("class", "salesline");
        });

        // update domains
        x.domain(d3.extent(salesData, d => d.month));
        y.domain([0, 110000])

        salesDisplayData = salesData;
        updateSalesLine(svg);

        // Hide
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 0);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 0);
    }

    function generateGDPBar(svg, gdpData){
        // define scales and axes
        x_gdp = d3.scaleBand()
            .domain(d3.map(gdpData, d => d.Date))
            .range([40, width])
            .padding(0.2);
        y_gdp = d3.scaleLinear()
            .domain([18.0, 22.0])
            .range([height, margin.top]);
        tooltip_bars = d3.select(".d3-tip-bars");
        let xAxis_gdp = d3.axisBottom()
            .scale(x_gdp)
            .tickValues([dateParserGDP('09-2019'), dateParserGDP('12-2019'), dateParserGDP('03-2020'), dateParserGDP('06-2020')])
            .tickFormat(dateFormatter);
        let yAxis_gdp = d3.axisLeft()
            .scale(y_gdp);

        // append axes and labels
        svg.append("g")
            .attr("class", "gdp-x-axis axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis_gdp);

        svg.append("g")
            .attr("class", "gdp-y-axis axis")
            .attr("transform", "translate(40,0)")
            .call(yAxis_gdp);

        svg.append("text")
            .attr("class", "gdp-y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 45)
            .attr("x", -30)
            .attr("dy", "1em")
            .style("opacity", "1")
            .style("text-anchor", "end")
            .style("font-size", "10px")
            .style("fill", "white")
            .text("GDP ($T)");

        // draw bars
        svg.selectAll(".bar-gdp")
            .data(gdpData)
            .enter().append("rect")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("fill", "#EAA0A1");
                tooltip_bars
                    .style("left", event.x - 600 + "px")
                    .style("top", event.y - 150 + "px")
                    .style("visibility", "visible")
                    .html("GDP: " + "$" + d.GDP + "T");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("fill", "#FFDADC");
                tooltip_bars.style("visibility", "hidden");
            })
            .attr("class", "bar-gdp")
            .attr("x", d => x_gdp(d.Date))
            .attr("y", d => y_gdp(d.GDP))
            .attr("width", x_gdp.bandwidth())
            .attr("height", d => height - y_gdp(d.GDP))
            .attr("fill", barColors[0]);

        // Hide
        svg.select('.gdp-x-axis')
            .transition()
            .duration(0)
            .style('opacity', 0);
        svg.select('.gdp-y-axis')
            .transition()
            .duration(0)
            .style('opacity', 0);
        svg.select(".gdp-y-axis-label")
            .transition()
            .duration(0)
            .style("opacity",0);
        svg.selectAll('.bar-gdp')
            .style('opacity', 0);
    }

    function generateMapGrid(svg, stateMapData){
        let squares_map = g.selectAll('.state-square')
            .data(stateMapData, d=> d.Abbreviation);
        let squaresE_map = squares_map.enter()
            .append('rect')
            .classed('state-square', true);
        squares_map = squares_map
            .merge(squaresE_map)
            .on("mouseover", function (event, d) {
                tooltip_grid
                    .style("left", event.x - 600 + "px")
                    .style("top", event.y - 150 + "px")
                    .style("visibility", "visible")
                    .html("State: " + d.Abbreviation);
            })
            .on("mouseout", function () {
                tooltip_grid.style("visibility", "hidden");
            })
            .attr('width', map_squareSize)
            .attr('height', map_squareSize)
            .attr('fill', 'lightgray')
            .classed('lockdown-square', function (d) { return d.Lockdown > 0; })
            .attr('x', function (d) { return (d.Id % map_numPerRow_initial) * (map_squareSize + map_squarePad);})
            .attr('y', function (d) { return (Math.floor(d.Id / map_numPerRow_initial)) * (map_squareSize + map_squarePad);})
            .attr('opacity', 0);

    }

    function generateFundMap(svg, usMapData, censusData, pppData) {
        let myMapVis = new MapVis('mapDiv', usMapData, censusData, pppData, 'relLoanCount');

        // Hide
        document.getElementById("mapDiv").style.display = "none";
    }

    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     *
     * @param wordData - data object for each word.
     * @param fillerCounts - nested data that includes
     *  element for each filler word type.
     */
    var setupVis = function (wordData, fillerCounts, salesData, configs, gdpData, statesMapData, usMapData, censusData, pppData) {
        // axis
        g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')');
        g.select('.x.axis').style('opacity', 0);

        // Text box
        document.getElementById("textBoxID").style.display = "none";
        // Sales drawing
        document.getElementById("drawCanvas").style.display = "none";

        // title
        g.append('text')
            .attr('class', 'sub-title covid-title')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .style('fill', '#829ABD')
            .text('A Viral Tale of');

        g.append('text')
            .attr('class', 'title covid-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 5))
            .text('Consumerism');

        g.selectAll('.covid-title')
            .attr('opacity', 0);

        // credits
        g.append('text')
            .attr('class', 'title credits-title')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .text('Take Action');
        g.append('text')
            .attr('class', 'sub-text credits-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 5))
            .text('Support your local businesses!');
        g.selectAll('.credits-title')
            .attr('opacity', 0);

        // count filler word count title
        // g.append('text')
        //     .attr('class', 'title count-title highlight')
        //     .attr('x', width / 2)
        //     .attr('y', height / 3)
        //     .text('12.6 Million')
        //     .style("color", "#EAA0A1");
        //
        // g.append('text')
        //     .attr('class', 'sub-title count-title')
        //     .attr('x', width / 2)
        //     .attr('y', (height / 3) + (height / 5))
        //     .text('COVID-19 Cases');
        //
        // g.selectAll('.count-title')
        //     .attr('opacity', 0);

        // Images

        // Covid consumer expenditure line
        g.append('image')
            .attr('id', 'sales_img')
            .attr('width', width)
            .attr('height', height)
            .attr("xlink:href", "covid.png")
            .attr('opacity', 0);
        // Meet patrice image
        g.append('image')
            .attr('id', 'patrice_img')
            .attr('width', width)
            .attr('height', height)
            .attr("xlink:href", "Meditation-amico.png")
            .attr('opacity', 0);
        // Closed image
        g.append('image')
            .attr('id', 'closed_img')
            .attr('width', width)
            .attr('height', height)
            .attr("xlink:href", "Depression-bro.png")
            .attr('opacity', 0);
        // Uncertain image
        g.append('image')
            .attr('id', 'uncertain_img')
            .attr('width', width)
            .attr('height', height)
            .attr("xlink:href", "Worried-amico.png")
            .attr('opacity', 0);

        // square grid
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var squares = g.selectAll('.square').data(wordData, function (d) { return d.word; });
        var squaresE = squares.enter()
            .append('rect')
            .classed('square', true);
        squares = squares
            .merge(squaresE)
            .attr('width', squareSize)
            .attr('height', squareSize)
            .attr('fill', '#fff')
            .classed('fill-square', function (d) { return d.filler; })
            .attr('x', function (d) { return d.x;})
            .attr('y', function (d) { return d.y;})
            .attr('opacity', 0);

        // barchart
        // Using .merge here to ensure
        // new and old data have same attrs applied
        var bars = g.selectAll('.bar').data(fillerCounts);
        var barsE = bars.enter()
            .append('rect')
            .attr('class', 'bar');
        bars = bars.merge(barsE)
            .attr('x', 0)
            .attr('y', function (d, i) { return yBarScale(i);})
            .attr('fill', function (d, i) { return barColors[i]; })
            .attr('width', 0)
            .attr('height', yBarScale.bandwidth());

        generateGDPBar(svg, gdpData);
        generateSalesLine(svg, salesData, salesConfigs);
        generateMapGrid(svg, statesMapData);
        generateFundMap(svg, usMapData, censusData, pppData);

    };

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */
    var setupSections = function () {
        // activateFunctions are called each
        // time the active section changes
        activateFunctions[0] = showTitle;
        activateFunctions[1] = showPatrice; // Meet patrice
        activateFunctions[2] = showGrid; // When it all began
        activateFunctions[3] = highlightGrid; // Lockdowns in march
        activateFunctions[4] = showMapGrid; // A new normal
        activateFunctions[5] = showClosed; // Sorry, we're closed
        activateFunctions[6] = showHistPart; // A sharp drop
        activateFunctions[7] = showHistAll; // The recovery so far
        activateFunctions[8] = showUncertainty; // Overwhelming uncertainty
        activateFunctions[9] = drawSales; // Consumer expenditure (draw)
        activateFunctions[10] = revealSales; // Consumer expenditure (reveal)
        activateFunctions[11] = showConsumption; // A tale of two recessions
        activateFunctions[12] = showConsumptionCovid; // Consumer expenditure by sector
        activateFunctions[13] = showFunding; // Federal funding
        activateFunctions[14] = showTextBox; // We're in this fight together (insert text box)
        activateFunctions[15] = showCredits; // Credits

        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        // for (var i = 0; i < 9; i++) {
        //   updateFunctions[i] = function () {};
        // }
        // updateFunctions[7] = updateCough;
    };

    /**
     * ACTIVATE FUNCTIONS
     *
     * These will be called their
     * section is scrolled to.
     *
     * General pattern is to ensure
     * all content for the current section
     * is transitioned in, while hiding
     * the content for the previous section
     * as well as the next section (as the
     * user may be scrolling up or down).
     *
     */

    /**
     * showTitle - initial title
     *
     * hides: count title
     * (no previous step to hide)
     * shows: intro title
     *
     */
    function showTitle() {
        // Hide
        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();
        d3.selectAll('.d3-tip-grid').remove();
        // Hide closed img
        d3.select('#patrice_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        // Show
        g.selectAll('.covid-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);
    }

    function showPatrice() {
        // Hide
        g.selectAll('.covid-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.state-square')
            .transition()
            .duration(0)
            .attr('opacity', 0);
        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();
        d3.selectAll('.d3-tip-grid').remove();

        // Show
        d3.select('#patrice_img')
            .transition()
            .duration(600)
            .attr('opacity', 1);

    }

    /**
     * showGrid - square grid
     *
     * hides: filler count title
     * hides: filler highlight in grid
     * shows: square grid
     *
     */
    function showGrid() {
        // Hide
        g.selectAll('.count-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);
        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();

        // Hide patrice img
        d3.select('#patrice_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        // Show
        g.selectAll('.state-square')
            .transition()
            .duration(800)
            .attr('x', function (d) { return (d.Id % map_numPerRow_initial) * (map_squareSize + map_squarePad);})
            .attr('y', function (d) { return (Math.floor(d.Id / map_numPerRow_initial)) * (map_squareSize + map_squarePad);})
            .attr('fill', 'lightgray')
            .attr('opacity', 1.0);

        g.selectAll('.state-square')
            .transition()
            .duration(800)
            .attr('x', function (d) { return (d.Id % map_numPerRow_initial) * (map_squareSize + map_squarePad);})
            .attr('y', function (d) { return (Math.floor(d.Id / map_numPerRow_initial)) * (map_squareSize + map_squarePad);})
            .delay(function (d) {
                if (d.Id === 0){
                    return 500;
                }
                else if (d.Id === 2){
                    return 1500;
                }
                else {
                    return 0;
                }
            })
            .attr('fill', function (d) {
                if (d.Id === 0){
                    return '#8FA4D2';
                }
                else if (d.Id === 2){
                    return '#EAA0A1';
                }
                else {
                    return 'lightgray';
                }
            })
            .attr('opacity', 1.0);
    }

    /**
     * highlightGrid - show fillers in grid
     *
     * hides: histchart, text and axis
     * shows: square grid and highlighted
     *  filler words. also ensures squares
     *  are moved back to their place in the grid
     */
    function highlightGrid() {
        // Hide
        // g.selectAll('.hist')
        //     .transition()
        //     .duration(600)
        //     .attr('height', function () { return 0; })
        //     .attr('y', function () { return height; })
        //     .style('opacity', 0);
        svg.select('.gdp-x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis-label')
            .transition().duration(500)
            .style('opacity', 0);
        svg.selectAll('.bar-gdp')
            .transition()
            .duration(600)
            .style('opacity', 0);

        // create tooltip
        tooltip_grid  = d3.select("#vis")
            .append("div")
            .attr("class", "d3-tip-grid")
            .style("visibility", "hidden");


        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();

        // Show
        map_squareSize = 42;
        map_squarePad = 12;
        g.selectAll('.state-square')
            .transition()
            .duration(800)
            .attr('x', function (d) { return (d.Id % map_numPerRow_initial) * (map_squareSize + map_squarePad);})
            .attr('y', function (d) { return (Math.floor(d.Id / map_numPerRow_initial)) * (map_squareSize + map_squarePad);})
            .attr('opacity', 1.0)
            .attr('fill', 'lightgray');
        g.selectAll('.lockdown-square')
            .transition()
            .duration(800)
            .attr('x', function (d) { return (d.Id % map_numPerRow_initial) * (map_squareSize + map_squarePad);})
            .attr('y', function (d) { return (Math.floor(d.Id / map_numPerRow_initial)) * (map_squareSize + map_squarePad);})
            .delay(function (d) {
                return 5 * (Math.floor(d.Id / map_numPerRow_initial)) * (map_squareSize + map_squarePad);
            })
            .attr('opacity', 1.0)
            .attr('fill', function (d) {
                if (d.Lockdown === 0) {
                    return 'lightgray';
                }
                else if (d.Lockdown === 1) {
                    return '#8FA4D2';
                }
                else if (d.Lockdown === 2) {
                    return '#EAA0A1';
                }
            });
    }

    function showMapGrid() {
        // Hide GDP bars
        svg.select('.gdp-x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis-label')
            .transition().duration(500)
            .style('opacity', 0);
        svg.selectAll('.bar-gdp')
            .transition()
            .duration(600)
            .style('opacity', 0);
        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();

        // Hide closed img
        d3.select('#closed_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        // create tooltip
        tooltip_grid  = d3.select("#vis")
            .append("div")
            .attr("class", "d3-tip-grid")
            .style("visibility", "hidden");

        // Show
        map_squareSize = 36;
        map_squarePad = 12;
        g.selectAll('.state-square')
            .transition()
            .duration(800)
            .attr('x', function (d) { return (d.Col) * (map_squareSize + map_squarePad);})
            .attr('y', function (d) { return (d.Row) * (map_squareSize + map_squarePad);})
            .attr('opacity', 1.0)
            .attr('fill', function (d) {
                if (d.Lockdown === 0) {
                    return 'lightgray';
                }
                else if (d.Lockdown === 1) {
                    return '#8FA4D2';
                }
                else if (d.Lockdown === 2) {
                    return '#EAA0A1';
                }
            });

    }

    function showClosed() {
        // Hide GDP bars
        svg.select('.gdp-x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis-label')
            .transition().duration(500)
            .style('opacity', 0);
        svg.selectAll('.bar-gdp')
            .transition()
            .duration(600)
            .style('opacity', 0);
        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();

        // Hide grid
        d3.selectAll('.d3-tip-grid').remove();
        g.selectAll('.state-square')
            .transition()
            .duration(800)
            .attr('x', 0)
            .attr('y', function (d, i) {
                if (i < 25) {
                    return 0;
                }
                else {
                    return 500;
                }
            })
            .transition()
            .duration(0)
            .attr('opacity', 0);

        // Show closed img
        d3.select('#closed_img')
            .transition()
            .duration(800)
            .attr('opacity', 1);

    }


    /**
     * showHistPart - shows the first part
     *  of the histogram of filler words
     *
     * hides: grid
     * hides: last half of histogram
     * shows: first half of histogram
     *
     */
    function showHistPart() {
        // Hide tip sales
        d3.selectAll('.d3-tip-sales').remove();
        // Hide closed img
        d3.select('#closed_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        // create tooltip
        tooltip_bars  = d3.select("#vis")
            .append("div")
            .attr("class", "d3-tip-bars")
            .style("visibility", "hidden");

        // Show
        svg.select('.gdp-x-axis')
            .transition().duration(500)
            .style('opacity', 1);
        svg.select('.gdp-y-axis')
            .transition().duration(500)
            .style('opacity', 1);
        svg.select('.gdp-y-axis-label')
            .transition().duration(500)
            .style('opacity', 1);

        // here we only show a bar if
        // it is before the 15 minute mark
        g.selectAll('.bar-gdp')
            .transition()
            .duration(600)
            .style('opacity', function (d) { return (d.Date < dateParserGDP('05-2020')) ? 1.0 : 1e-6; });
        svg.selectAll(".bar-gdp")
            .transition()
            .duration(600)
            .attr('y', function (d) { return (d.Date < dateParserGDP('05-2020')) ? (y_gdp(d.GDP)) : height; })
            .attr('height', function (d) { return (d.Date < dateParserGDP('05-2020')) ? height - (y_gdp(d.GDP)) : 0; })
            .style('opacity', function (d) { return (d.Date < dateParserGDP('05-2020')) ? 1.0 : 1e-6; });

    }

    /**
     * showHistAll - show all histogram
     *
     * hides: barchart
     * (previous step is also part of the
     *  histogram, so we don't have to hide
     *  that)
     * shows: all histogram bars
     *
     */
    function showHistAll() {
        // ensure the axis to histogram one
        // showAxis(xAxisHist);
        // Hide sales line
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 0);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 0);
        // Hide uncertain img
        d3.select('#uncertain_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        d3.selectAll('.d3-tip-sales').remove();
        // create tooltip
        tooltip_bars  = d3.select("#vis")
            .append("div")
            .attr("class", "d3-tip-bars")
            .style("visibility", "hidden");

        svg.select('.gdp-x-axis')
            .transition().duration(500)
            .style('opacity', 1);
        svg.select('.gdp-y-axis')
            .transition().duration(500)
            .style('opacity', 1);
        svg.select('.gdp-y-axis-label')
            .transition().duration(500)
            .style('opacity', 1);
        svg.selectAll(".bar-gdp")
            .transition()
            .duration(1200)
            .attr('y', function (d) { return y_gdp(d.GDP); })
            .attr('height', function (d) { return height - (y_gdp(d.GDP)); })
            .style('opacity', 1.0);
    }

    function showUncertainty() {
        // Hide GDP bar
        svg.select('.gdp-x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.gdp-y-axis-label')
            .transition().duration(500)
            .style('opacity', 0);
        svg.selectAll('.bar-gdp')
            .transition()
            .duration(600)
            .style('opacity', 0);
        d3.selectAll('.d3-tip-bars').remove();
        d3.selectAll('.d3-tip-sales').remove();

        // Hide sales drawing
        document.getElementById("drawCanvas").style.display = "none";


        // Show uncertain img
        d3.select('#uncertain_img')
            .transition()
            .duration(800)
            .attr('opacity', 1);
    }

    function drawSales() {
        // Hide uncertain img
        d3.select('#uncertain_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);
        // Hide consumption line
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 0);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 0);
        // Hide sales reveal
        d3.select('#sales_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        // Show sales drawing
        document.getElementById("drawCanvas").style.display = "block";
    }

    function revealSales() {
        // Hide sales
        salesLineOn = false;
        document.getElementById("drawCanvas").style.display = "none";

        // Hide consumption line
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 0);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 0);
        d3.selectAll('.d3-tip-sales').remove();

        // Show sales reveal
        d3.select('#sales_img')
            .transition()
            .duration(800)
            .attr('opacity', 1);
    }

    /**
     * showConsumption
     *
     * hides: everything
     * shows: Sophie's line graph
     *
     */
    function showConsumption() {
        // Hide consumption line
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 0);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 0);
        svg.selectAll('path')
            .remove();
        // Hide sales reveal
        d3.select('#sales_img')
            .transition()
            .duration(600)
            .attr('opacity', 0);


        // Show
        salesDisplayData = salesData;
        generateSalesLine(svg, salesData, salesConfigs);
        // updateSalesLine(svg);
        // create sales tooltip
        tooltip_sales = d3.select("#vis")
            .append("div")
            .attr("class", "d3-tip-sales")
            .style("visibility", "visible");

        // Show line graph
        // Sophie's sales line visualization
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 1);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 1);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 1);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 3);
        salesLineOn = true;
    }

    /**
     * showBar - barchart
     *
     * hides: square grid
     * hides: histogram
     * shows: barchart
     *
     */
    function showConsumptionCovid() {
        // ensure bar axis is set
        // showAxis(xAxisBar);
        // Hide
        document.getElementById("mapDiv").style.display = "none";

        // Show
        // Reset if not coming from previous slide
        if (salesLineOn == false) {
            svg.selectAll('path')
                .remove();
            generateSalesLine(svg, salesData, salesConfigs);
            updateSalesLine(svg);
            // Sophie's sales line visualization
            svg.select('.x-axis')
                .transition().duration(500)
                .style('opacity', 1);
            svg.select('.y-axis')
                .transition().duration(500)
                .style('opacity', 1);
            svg.select(".y-axis-label")
                .transition().duration(500)
                .style("opacity", 1);
            svg.selectAll('.salesline')
                .transition().duration(500)
                .attr('stroke-width', 3);
            console.log("added axes")
        }
        salesDisplayData = salesData.filter((value, index) => {
            return ((value.month) >= (dateParser("Sunday, December 1, 2019")));
        });
        updateSalesLine(svg);
        // create sales tooltip
        tooltip_sales = d3.select("#vis")
            .append("div")
            .attr("class", "d3-tip-sales")
            .style("visibility", "visible");
        // svg.select('.x-axis')
        //     .transition().duration(500)
        //     .style('opacity', 1);
        // svg.select('.y-axis')
        //     .transition().duration(500)
        //     .style('opacity', 1);
        // svg.select(".y-axis-label")
        //     .transition().duration(500)
        //     .style("opacity", 1);
        // svg.selectAll('.salesline')
        //     .transition().duration(500)
        //     .attr('stroke-width', 3);
    }

    function showFunding() {
        // Hide
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 0);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 0);
        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();
        g.selectAll('.credits-title')
            .transition()
            .duration(600)
            .attr('opacity', 0.0);
        salesLineOn = false;
        document.getElementById("textBoxID").style.display = "none";

        // Show
        document.getElementById("mapDiv").style.display = "block";
    }

    function showTextBox () {
        // Hide sales line
        svg.select('.x-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select('.y-axis')
            .transition().duration(500)
            .style('opacity', 0);
        svg.select(".y-axis-label")
            .transition().duration(500)
            .style("opacity", 0);
        svg.selectAll('.salesline')
            .transition().duration(500)
            .attr('stroke-width', 0);
        d3.selectAll('.d3-tip-sales').remove();
        d3.selectAll('.d3-tip-bars').remove();
        // Hide map
        document.getElementById("mapDiv").style.display = "none";
        // Hide Credits
        g.selectAll('.credits-title')
            .transition()
            .duration(600)
            .attr('opacity', 0.0);

        // Show text box
        document.getElementById("textBoxID").style.display = "block";

    }


    function showCredits() {
        // Hide text box
        document.getElementById("textBoxID").style.display = "none";
        // Hide map
        document.getElementById("mapDiv").style.display = "none";


        // Show
        g.selectAll('.credits-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);
    }

    /**
     * UPDATE FUNCTIONS
     *
     * These will be called within a section
     * as the user scrolls through it.
     *
     * We use an immediate transition to
     * update visual elements based on
     * how far the user has scrolled
     *
     */



    /**
     * DATA FUNCTIONS
     *
     * Used to coerce the data into the
     * formats we need to visualize
     *
     */

    /**
     * getWords - maps raw data to
     * array of data objects. There is
     * one data object for each word in the speach
     * data.
     *
     * This function converts some attributes into
     * numbers and adds attributes used in the visualization
     *
     * @param rawData - data read in from file
     */
    function getWords(rawData) {
        console.log(rawData);
        return d3.map(rawData, function (d, i) {
            // is this word a filler word?
            d.filler = (d.filler === '1') ? true : false;
            // time in seconds word was spoken
            d.time = +d.time;
            // time in minutes word was spoken
            d.min = Math.floor(d.time / 60);

            // positioning for square visual
            // stored here to make it easier
            // to keep track of.
            d.col = i % numPerRow;
            d.x = d.col * (squareSize + squarePad);
            d.row = Math.floor(i / numPerRow);
            d.y = d.row * (squareSize + squarePad);
            return d;
        });
    }

    /**
     * getFillerWords - returns array of
     * only filler words
     *
     * @param data - word data from getWords
     */
    function getFillerWords(data) {
        return data.filter(function (d) {return d.filler; });
    }


    /**
     * groupByWord - group words together
     * using nest. Used to get counts for
     * barcharts.
     *
     * @param words
     */
    function groupByWord(words) {
        return d3.rollup(words, v => v.length, d=>d.word);
    }

    /**
     * activate -
     *
     * @param index - index of the activated section
     */
    chart.activate = function (index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    /**
     * update
     *
     * @param index
     * @param progress
     */
    // chart.update = function (index, progress) {
    //   updateFunctions[index](progress);
    // };

    // return chart function
    return chart;
};

/**
 * Get Data
 * sales.csv
 * gdp.csv
 *
 */
// Function to convert date objects to strings or reverse
// takes a date -> string
let dateFormatter = d3.timeFormat("%b %Y");

// takes a string -> date
let dateParser = d3.timeParse("%A, %B%e, %Y");
let dateParserGDP = d3.timeParse("%m-%Y");
let salesData, gdpData, statesMapData, wordData, usMapData, censusData, pppData;
// names of columns
let all_configs = ["All other gen. merchandise stores", "Automobile and other motor vehicle dealers",
    "Automotive parts, acc., and tire stores", "Beer, wine and liquor stores", "Building mat. and garden equip. and supplies dealers",
    "Building mat. and supplies dealers", "Clothing and clothing access. stores", "Clothing stores", "Department stores",
    "Electronic shopping and mail order houses", "Electronics and appliance stores", "Food and beverage stores",
    "Food services and drinking places", "Fuel dealers", "Furniture and home furnishings stores",
    "Furniture, home furn, electronics, and appliance stores", "Gasoline stations", "General merchandise stores", "Grocery stores",
    "Health and personal care stores", "Jewelry stores", "Men's clothing stores", "Miscellaneous stores retailers", "Motor vehicle and parts dealers",
    "Nonstore retailers", "Other general merchandise stores", "Pharmacies and drug stores", "Retail and food services sales, total",
    "Shoe stores", "Sporting goods, hobby, musical instrument, and book stores", "Warehouse clubs and superstores", "Women's clothing stores"]

let some_configs = ["Motor vehicle and parts dealers", "Electronics and appliance stores",
    "Food and beverage stores", "Beer, wine and liquor stores",
    "Gasoline stations", "Clothing stores", "Sporting goods, hobby, musical instrument, and book stores",
    "General merchandise stores", "Grocery stores", "Warehouse clubs and superstores", "Electronic shopping and mail order houses",
    "Food services and drinking places"]


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(wordData, salesData, gdpData, statesMapData, usMapData, censusData, pppData, configs) {
    // create a new plot and
    // display it
    var plot = scrollVis(salesData, configs);
    let allData = {
        'wordData': wordData,
        'salesData': salesData,
        'gdpData': gdpData,
        'statesMapData': statesMapData,
        'usMapData': usMapData,
        'censusData': censusData,
        'pppData': pppData,
        'configs': configs
    }
    d3.select('#vis')
        .datum(allData)
        .call(plot);

    // setup scroll functionality
    var scroll = scroller()
        .container(d3.select('#graphic'));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

        // activate current section
        plot.activate(index);
    });

    // scroll.on('progress', function (index, progress) {
    //   plot.update(index, progress);
    // });
}

Promise.all([
    d3.csv("data/sales.csv"),
    d3.csv("data/gdp_clean.csv"),
    d3.csv("data/us_map_grid.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"), // already projected -> you can just scale it to ft your browser window
    d3.csv("data/census_usa.csv"),
    // d3.csv("data/ppp_data.csv"),
    d3.tsv("data/words.tsv"),
]).then(function(files) {
    // files[0] will contain file1.csv
    // files[1] will contain file2.csv
    console.log(files[0])
    console.log(files[1])

    salesData = files[0];
    gdpData = files[1];
    statesMapData = files[2];
    usMapData = files[3];
    censusData = files[4];
    pppData = [];
    wordData = files[5];  // Dummy data used in tutorial

    // convert string to date
    salesData.forEach(function(row){
        row.month = dateParser(row.month);
        some_configs.forEach(function(d) {
            row[d] = +row[d];
        })
    });

    gdpData.forEach(function(row){
        row.Date = dateParserGDP(row.Date);
        row.GDP = +row.GDP;
    });

    statesMapData.forEach(function(row){
        row.Row = +row.Row;
        row.Col = +row.Col;
        row.Lockdown = +row.Lockdown;
        row.Id = +row.Id;
    })

    display(wordData, salesData, gdpData, statesMapData, usMapData, censusData, pppData, some_configs);

}).catch(function(err) {
    // handle error here
    console.log("Couldn't load data", err)
})