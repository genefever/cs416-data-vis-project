const parseDate = d3.timeParse('%m/%d/%Y')
let data = []

d3.csv('data_deaths_2020_2023.csv').then(function (csvData) {
  data = csvData.map(function (d) {
    return {
      date: parseDate(d['End Date']),
      all_deaths: +d['All Cause'],
      natural_deaths: +d['Natural Cause'],
      covid_19_multiple: +d['COVID-19 (Multiple Cause of Death)'],
      covid_19_underlying: +d['COVID-19 (Underlying Cause of Death)'],
    }
  })

  if (data.length === 0) {
    // Handle empty data array
    console.error('Empty data array')
    return
  }

  // Set up the SVG container
  const margin = { top: 20, right: 30, bottom: 30, left: 50 }
  let width = window.innerWidth - margin.left - margin.right
  let height = window.innerHeight - margin.top - margin.bottom

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr(
      'viewBox',
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

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
  const line1 = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.all_deaths))

  const line2 = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.natural_deaths))

  const line3 = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.covid_19_multiple))

  const line4 = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.covid_19_underlying))

  // Append the lines
  svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('d', line1)

  svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'green')
    .attr('d', line2)

  svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'blue')
    .attr('d', line3)

  svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'orange')
    .attr('d', line4)

  // Append x-axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))

  // Append y-axis
  svg.append('g').call(d3.axisLeft(yScale))

  // Append y-axis label
  svg
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left - 50)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Number of Deaths')

  // Function to handle window resize
  function handleResize() {
    width = window.innerWidth - margin.left - margin.right
    height = window.innerHeight - margin.top - margin.bottom

    svg
      .attr('width', '100%')
      .attr('height', '100%')
      .attr(
        'viewBox',
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )

    xScale.range([0, width])
    yScale.range([height, 0])

    svg
      .select('.x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))

    svg.select('.y-axis').call(d3.axisLeft(yScale))

    svg.selectAll('path').attr('d', (line) => line(data))
  }

  // Call handleResize on window resize event
  window.addEventListener('resize', handleResize)
})