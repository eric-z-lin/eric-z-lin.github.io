/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    // constructor method to initialize Map object
    constructor(parentElement, geoData, usaData, pppData, selectedCategory) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.usaData = usaData;
        this.pppData = pppData;
        this.selectedCategory = selectedCategory;
        this.displayData = [];

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.colors = d3.scaleLinear()
            .range(['#FFFFFF', '#EAA0A1']);

        this.initMap()
    }

    initMap() {
        let mapObject = this

        mapObject.margin = {top: 20, right: 100, bottom: 100, left: 100};
        mapObject.width = $("#" + mapObject.parentElement).width() - mapObject.margin.left - mapObject.margin.right;
        mapObject.height = $("#" + mapObject.parentElement).height() - mapObject.margin.top - mapObject.margin.bottom;

        // init drawing area
        mapObject.svg = d3.select("#" + mapObject.parentElement).append("svg")
            .attr("width", mapObject.width)
            .attr("height", mapObject.height)
            .attr('transform', `translate (${mapObject.margin.left}, ${mapObject.margin.top})`);

        mapObject.path = d3.geoPath();
        mapObject.us = mapObject.geoData;

        mapObject.viewpoint = {'width': 975, 'height': 610};
        mapObject.zoom = mapObject.width / mapObject.viewpoint.width;

        // adjust map position
        mapObject.map = mapObject.svg.append("g") // group will contain all state paths
            .attr("class", "states")
            .attr('transform', `scale(${mapObject.zoom} ${mapObject.zoom})`);

        mapObject.states = mapObject.map.selectAll(".state")
            .data(topojson.feature(mapObject.us, mapObject.us.objects.states).features)
            .enter().append("path")
            .attr('class','state')
            .attr("d", mapObject.path);
        mapObject.map.append("path")
            .datum(topojson.mesh(mapObject.us, mapObject.us.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "#627D98")
            .attr("stroke-linejoin", "round")
            .attr("pointer-events", "none")
            .attr("d", mapObject.path);

        // append tooltip
        mapObject.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');

        // append legend
        mapObject.legend = mapObject.svg.append("rect")
            .attr('transform', `translate(${mapObject.width * 2.8 / 4.5}, ${mapObject.height - 40})`)
            .attr("width", 200)
            .attr("height", 20);
        mapObject.defs = mapObject.svg.append("defs");
        mapObject.linearGradient = mapObject.defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        // append legend's axis
        mapObject.legendScale = d3.scaleLinear()
            .range([0,200])
        mapObject.legendAxis = d3.axisBottom()
            .scale(mapObject.legendScale)
            .ticks(3);
        mapObject.axis = mapObject.svg.append("g")
            .attr("class", "x-axis axis")
            .attr('transform', `translate(${mapObject.width * 2.8 / 4.5}, ${mapObject.height - 20})`)

        mapObject.wrangleData()

    }

    wrangleData() {
        let mapObject = this;

        //UNCOMMENT THIS FOR FULL DATA
        // // first, filter according to selectedTimeRange, init empty array
        // let filteredData = [];
        //
        //
        // filteredData = mapObject.pppData;
        //
        // // prepare covid data by grouping all rows by state
        // let pppDataByState = Array.from(d3.group(filteredData, d => d.State), ([key, value]) => ({key, value}))
        //
        // // init final data structure in which both data sets will be merged into
        // mapObject.stateInfo = []
        //
        // // merge
        // pppDataByState.forEach( state => {
        //
        //     // get full state name
        //     let stateName = nameConverter.getFullName(state.key)
        //
        //     // init counters
        //     let population = 0;
        //     let aCount = 0;
        //     let bCount = 0;
        //     let cCount = 0;
        //     let dCount = 0;
        //     let eCount = 0;
        //
        //     // look up population for the state in the census data set
        //     mapObject.usaData.forEach( row => {
        //         if(row.state === stateName){
        //             population += +row["2019"].replaceAll(',', '');
        //         }
        //     })
        //
        //     // calculate new cases by summing up all the entries for each state
        //     state.value.forEach( entry => {
        //         if (entry.LoanRange === "a $5-10 million") {
        //             aCount++;
        //         }
        //         else if (entry.LoanRange === "b $2-5 million") {
        //             bCount++;
        //         }
        //         else if (entry.LoanRange === "c $1-2 million") {
        //             cCount++;
        //         }
        //         else if (entry.LoanRange === "d $350,000-1 million") {
        //             dCount++;
        //         }
        //         else {
        //             eCount++;
        //         }
        //     });
        //
        //     let loanCount = aCount + bCount + cCount + dCount + eCount;
        //
        //     // populate the final data structure
        //     if (stateName === "" | stateName === "American Samoa" | stateName === "Guam" | stateName === "Puerto Rico" | stateName === "US Virgin Islands"){
        //         return null;
        //     }
        //     else {
        //         mapObject.stateInfo.push(
        //             {
        //                 state: stateName,
        //                 population: population,
        //                 loanCount: loanCount,
        //                 relLoanCount: (loanCount/population*100),
        //                 a: aCount,
        //                 b: bCount,
        //                 c: cCount,
        //                 d: dCount,
        //                 e: eCount
        //             }
        //         )
        //     }
        //
        // });

        mapObject.stateInfo = [
            {state: "Alaska", population: 731545, loanCount: 1713, relLoanCount: 0.23416194492478248, a: 14, },
            {state: "Alabama", population: 4903185, loanCount: 7867, relLoanCount: 0.1604467300336414, a: 53, },
            {state: "Arkansas", population: 3017804, loanCount: 4273, relLoanCount: 0.1415930259221606, a: 18, },
            {state: "Arizona", population: 7278717, loanCount: 11361, relLoanCount: 0.1560852001801966, a: 53, },
            {state: "California", population: 39512223, loanCount: 87916, relLoanCount: 0.22250329980168415, a: 625, },
            {state: "Colorado", population: 5758736, loanCount: 13431, relLoanCount: 0.23322826398015117, a: 91, },
            {state: "Connecticut", population: 3565287, loanCount: 8608, relLoanCount: 0.24143918848608822, a: 47, },
            {state: "District of Columbia", population: 705749, loanCount: 2810, relLoanCount: 0.39815855211980467, a: 14, },
            {state: "Delaware", population: 973764, loanCount: 2074, relLoanCount: 0.21298795190621134, a: 15, },
            {state: "Florida", population: 21477737, loanCount: 42047, relLoanCount: 0.19577015958431748, a: 183, },
            {state: "Georgia", population: 10617423, loanCount: 18401, relLoanCount: 0.17330947443649933, a: 118, },
            {state: "Hawaii", population: 1415872, loanCount: 3192, relLoanCount: 0.22544410794196088, a: 20, },
            {state: "Iowa", population: 3155070, loanCount: 5956, relLoanCount: 0.1887755263750091, a: 46, },
            {state: "Idaho", population: 1787065, loanCount: 3317, relLoanCount: 0.18561160338320096, a: 15, },
            {state: "Illinois", population: 12671821, loanCount: 27459, relLoanCount: 0.21669340184019328, a: 251, },
            {state: "Indiana", population: 6732219, loanCount: 11889, relLoanCount: 0.17659853311367324, a: 91, },
            {state: "Kansas", population: 2913314, loanCount: 5892, relLoanCount: 0.20224390505108616, a: 38, },
            {state: "Kentucky", population: 4467673, loanCount: 6458, relLoanCount: 0.14454952276050642, a: 55, },
            {state: "Louisiana", population: 4648794, loanCount: 9090, relLoanCount: 0.19553458380818767, a: 81, },
            {state: "Massachusetts", population: 6892503, loanCount: 18282, relLoanCount: 0.26524471588913345, a: 139, },
            {state: "Maryland", population: 6045680, loanCount: 12906, relLoanCount: 0.21347474560347224, a: 80, },
            {state: "Maine", population: 1344212, loanCount: 2870, relLoanCount: 0.21350798832327042, a: 20, },
            {state: "Michigan", population: 9986857, loanCount: 20012, relLoanCount: 0.20038336385511477, a: 183, },
            {state: "Minnesota", population: 5639632, loanCount: 13740, relLoanCount: 0.24363291789251496, a: 133, },
            {state: "Missouri", population: 6137428, loanCount: 11516, relLoanCount: 0.18763560240543758, a: 95, },
            {state: "Mississippi", population: 2976149, loanCount: 3909, relLoanCount: 0.13134423041319504, a: 17, },
            {state: "Montana", population: 1068778, loanCount: 2209, relLoanCount: 0.20668464358360672, a: 10, },
            {state: "North Carolina", population: 10488084, loanCount: 16183, relLoanCount: 0.15429891675162022, a: 90, },
            {state: "North Dakota", population: 762062, loanCount: 2188, relLoanCount: 0.28711574648781857, a: 14, },
            {state: "Nebraska", population: 1934408, loanCount: 4186, relLoanCount: 0.21639695452045277, a: 36, },
            {state: "New Hampshire", population: 1359711, loanCount: 3447, relLoanCount: 0.25350975317549096, a: 13, },
            {state: "New Jersey", population: 8882190, loanCount: 21935, relLoanCount: 0.24695486135739045, a: 164, },
            {state: "New Mexico", population: 2096829, loanCount: 3031, relLoanCount: 0.1445516062587841, a: 17, },
            {state: "Nevada", population: 3080156, loanCount: 5594, relLoanCount: 0.18161417798319307, a: 25, },
            {state: "New York", population: 19453561, loanCount: 47072, relLoanCount: 0.24197112292191647, a: 443, },
            {state: "Ohio", population: 11689100, loanCount: 23010, relLoanCount: 0.19685005689060747, a: 210, },
            {state: "Oklahoma", population: 3956971, loanCount: 6855, relLoanCount: 0.1732385706137346, a: 42, },
            {state: "Oregon", population: 4217737, loanCount: 9306, relLoanCount: 0.2206396463316703, a: 53, },
            {state: "Pennsylvania", population: 12801989, loanCount: 26074, relLoanCount: 0.20367147636199345, a: 204, },
            {state: "Rhode Island", population: 1059361, loanCount: 2472, relLoanCount: 0.23334821651920354, a: 16, },
            {state: "South Carolina", population: 5148714, loanCount: 7632, relLoanCount: 0.14823118938049384, a: 33, },
            {state: "South Dakota", population: 884659, loanCount: 1952, relLoanCount: 0.22064999056133494, a: 9, },
            {state: "Tennessee", population: 6829174, loanCount: 11293, relLoanCount: 0.16536406891960873, a: 85, },
            {state: "Texas", population: 28995881, loanCount: 52099, relLoanCount: 0.17967724450241743, a: 373, },
            {state: "Utah", population: 3205958, loanCount: 6757, relLoanCount: 0.21076383408641036, a: 39, b:237,c:544,d:2008,e:3929},
            {state: "Virginia", population: 8535519, loanCount: 16164, relLoanCount: 0.18937337026606113, a: 110, b:588,c:1331,d:4879,e:9256},
            {state: "Vermont", population: 623989, loanCount: 1547, relLoanCount: 0.24792103706956373, a: 7, b:60,c:108,d:480,e:892},
            {state: "Washington", population: 7614893, loanCount: 15967, relLoanCount: 0.2096812128548622, a: 118, b:612, c:1257, d:4744, e:9236},
            {state: "Wisconsin", population: 5822434, loanCount: 12388, relLoanCount: 0.21276325330609158, a: 98, b: 512, c: 1059, d:3871, e:6848},
            {state: "West Virginia", population: 1792147, loanCount: 2299, relLoanCount: 0.12828188759069428, a: 9, b:93, c:175, d:703, e:1319},
            {state: "Wyoming", population: 578759, loanCount: 1374, relLoanCount: 0.23740451552373268, a: 9, b:24, c:87, d:420, e:834},
        ]


        console.log('final data structure for myMapVis', mapObject.stateInfo);

        mapObject.updateMap();
    }

    findValue(stateName) {
        let mapObject = this;
        let returnValue = [];
        mapObject.stateInfo.forEach( state => {
            if (stateName === state.state) {
                returnValue = state;
            }
        })
        return returnValue;
    }

    updateMap() {
        let mapObject = this;

        // update color domain
        mapObject.colors.domain([0,
            d3.max(mapObject.stateInfo, function(d){
                return d[mapObject.selectedCategory];
            })
        ]);

        mapObject.states.style("fill", function(d, index) {
                let thisStatesInfo = mapObject.findValue (d.properties.name);
                console.log(thisStatesInfo)
                return mapObject.colors(thisStatesInfo[mapObject.selectedCategory]);
            })
            .on('mouseover', function(event, d){
                let thisStatesInfo = mapObject.findValue (d.properties.name);

                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black');

                mapObject.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                <div style="border: thin solid grey; border-radius: 5px; background: #627D98; padding: 20px">
                     <h3> ${thisStatesInfo.state}<h3>
                     <h4> Population: ${thisStatesInfo.population}</h4>
                     <h4> Loans (absolute): ${thisStatesInfo.loanCount}</h4>
                     <h4> Loans (relative per capita): ${thisStatesInfo.relLoanCount}</h4>
                     <h4> Number of $5-10 million loans: ${thisStatesInfo.a}</h4>  
                </div>`);
                //    <h4> $2-5 million: ${thisStatesInfo.b}</h4>
                //                      <h4> $1-2 million: ${thisStatesInfo.c}</h4>
                //                      <h4> $350,000-1 million: ${thisStatesInfo.d}</h4>
                //                      <h4> $150,000-350,000: ${thisStatesInfo.e}</h4>
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')

                mapObject.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        // draw legend axis
        mapObject.legendScale.domain([0,
            d3.max(mapObject.stateInfo, function(d){
                return d[mapObject.selectedCategory];
            })
        ]);
        mapObject.svg.select(".x-axis").call(mapObject.legendAxis);

        // append legend
        mapObject.linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", '#FFFFFF');
        mapObject.linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", '#EAA0A1');
        mapObject.legend.style("fill", "url(#linear-gradient)");

    }
}