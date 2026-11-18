export function fixRows(data,results) {
  return data.observations.map((p,i)=>{
    const truth=data.truthPoints?.[i];
    const row={...p,truth_latitude:truth?.latitude,truth_longitude:truth?.longitude,truth_segment:data.truthIds?.[i]};
    for(const {result} of results) {
      const fix=result.matches[i], prefix=result.algorithm;
      const gps=data.roads.frame.toGPS(fix.xy);
      Object.assign(row,{[prefix+'_segment']:fix.edge.id,[prefix+'_latitude']:gps.latitude,
        [prefix+'_longitude']:gps.longitude,[prefix+'_residual_m']:fix.error});
    }
    return row;
  });
}

export function csv(rows) {
  const keys=Object.keys(rows[0]);
  const cell=value=>{
    const text=String(value??'');
    return /[",\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;
  };
  return [keys.join(','),...rows.map(row=>keys.map(key=>cell(row[key])).join(','))].join('\n')+'\n';
}

export function routeReport(data,results) {
  return {
    groundTruth:data.truthRoute?{segments:data.truthRoute,distance_m:data.truthDistance,
      geometry:data.truthGeometry.map(data.roads.frame.toGPS)}:null,
    methods:results.map(({result,metrics})=>({
      algorithm:result.algorithm,segments:result.segments,metrics,pathCost:result.cost,
      geometryParts:result.parts.map(part=>part.map(data.roads.frame.toGPS))
    }))
  };
}
