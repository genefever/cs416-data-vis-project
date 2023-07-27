const parseDate = d3.timeParse('%m/%d/%Y')
let data = []

function processData(csvData) {
  data = csvData.map((d) => ({
    date: parseDate(d['End Date']),
    all_deaths: +d['All Cause'],
    natural_deaths: +d['Natural Cause'],
    covid_19_multiple: +d['COVID-19 (Multiple Cause of Death)'],
    covid_19_underlying: +d['COVID-19 (Underlying Cause of Death)'],
  }))

  if (data.length === 0) {
    // Handle empty data array
    console.error('Empty data array')
    return
  }
}

function setupChart() {
  // Set up the SVG container
  const wrapper = d3.select('#chart').append('svg')
  const bounds = wrapper.append('g')
  const margin = { top: 20, right: 30, bottom: 30, left: 50 }
  let width = window.innerWidth - margin.left - margin.right
  let height = window.innerHeight - margin.top - margin.bottom

  wrapper
    .attr('width', '100%')
    .attr('height', '100%')
    .attr(
      'viewBox',
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )

  bounds.attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Set up scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width])
  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (d) =>
        d3.max([
          d.all_deaths,
          d.natural_deaths,
          d.covid_19_multiple,
          d.covid_19_underlying,
        ])
      ),
    ])
    .range([height, 0])

  // Set up line generators
  const lineAllDeaths = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.all_deaths))

  const lineNaturalDeaths = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.natural_deaths))

  const lineCovidMultiple = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.covid_19_multiple))

  const lineCovidUnderlying = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.covid_19_underlying))

  // Append the lines
  bounds
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('d', lineAllDeaths)

  bounds
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'green')
    .attr('d', lineNaturalDeaths)

  bounds
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'blue')
    .attr('d', lineCovidMultiple)

  bounds
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'orange')
    .attr('d', lineCovidUnderlying)

  // Append x-axis
  bounds
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))

  // Append y-axis
  bounds.append('g').attr('class', 'y-axis').call(d3.axisLeft(yScale))

  // Append y-axis label
  bounds
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left - 50)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Number of Deaths')

  // Add circle for the "hovered" point
  const circle = bounds
    .append('circle')
    .attr('class', 'hover-circle')
    .attr('r', 7)
    .style('fill', 'red')
    .style('opacity', 0) // Initially hide the circle

  // Add vertical line
  const verticalLine = bounds
    .append('line')
    .attr('class', 'vertical-line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', height)
    .style('stroke', 'black')
    .style('stroke-width', '1px')
    .style('opacity', 0) // Initially hide the vertical line

  // Add tooltip functionality
  const tooltip = d3.select('#tooltip')

  bounds
    .append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .style('opacity', 0) // Initially hide the overlay
    .on('mouseover', function () {
      tooltip.style('opacity', 1) // Show the tooltip when mouseover occurs
      circle.style('opacity', 1) // Show the circle when mouseover occurs
      verticalLine.style('opacity', 1) // Show the vertical line when mouseover occurs
    })
    .on('mouseout', function () {
      tooltip.style('opacity', 0) // Hide the tooltip when mouseout occurs
      circle.style('opacity', 0) // Hide the circle when mouseout occurs
      verticalLine.style('opacity', 0) // Hide the vertical line when mouseout occurs
    })
    .on('mousemove', function (event) {
      const [x, y] = d3.pointer(event, this)
      const date = xScale.invert(x)
      const bisect = d3.bisector((d) => d.date).left
      const index = bisect(data, date)
      const datapoint = data[index]

      const formatDate = d3.timeFormat('%B %Y')
      const formattedDate = formatDate(datapoint.date)

      const formatDeaths = d3.format(',')
      const formattedDeaths = formatDeaths(datapoint.all_deaths)

      tooltip
        .style('left', x + 'px')
        .style('top', y + 'px')
        .html(`<strong>${formattedDate}</strong><br>Deaths: ${formattedDeaths}`)

      const closestDataPoint = data[index]
      const closestXValue = xScale(closestDataPoint.date)
      const closestYValue = yScale(closestDataPoint.all_deaths)

      circle.attr('cx', closestXValue).attr('cy', closestYValue) // Update circle position

      verticalLine
        .attr('x1', closestXValue)
        .attr('x2', closestXValue)
        .attr('y1', closestYValue)
        .attr('y2', height) // Update vertical line position
    })
}

// Function to handle window resize
function handleResize() {
  const wrapper = d3.select('#chart').select('svg')
  const bounds = wrapper.select('g')

  width = window.innerWidth - margin.left - margin.right
  height = window.innerHeight - margin.top - margin.bottom

  wrapper
    .attr('width', '100%')
    .attr('height', '100%')
    .attr(
      'viewBox',
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )

  bounds.attr('transform', `translate(${margin.left}, ${margin.top})`)

  xScale.range([0, width])
  yScale.range([height, 0])

  bounds
    .select('.x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
  bounds.select('.y-axis').call(d3.axisLeft(yScale))
  bounds.selectAll('path').attr('d', (line) => line(data))
}

// Call handleResize on window resize event
window.addEventListener('resize', handleResize)

d3.csv('data_deaths_2020_2023.csv')
  .then(processData)
  .then(setupChart)
  .catch((error) => {
    console.error('Error loading CSV data:', error)
  })

window.addEventListener('resize', handleResize)
