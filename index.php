<?php
  
  ini_set('memory_limit', '-1');
  
  
  $dsn = "pgsql:host=geoportal.bbv-deutschland.de;dbname=" . $argv[1] . ";port=63303";
  $opt = [
	PDO::ATTR_ERRMODE       => PDO::ERRMODE_EXCEPTION,
	PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
	PDO::ATTR_EMULATE_PREPARES => false
	];
	$pdo = new PDO($dsn, 'BBVGISAdmin', 'BBVQGIS01', $opt);
  
  if ($argv[2] == "point") {
	  $result = $pdo ->query("SELECT *, ST_AsGeoJSON(ST_Transform(geometry, 4326)) As geojson FROM crm_" . $argv[3] . "_gee_mirror");
  } elseif ($argv[2] == "polygon") {
	  $result = $pdo ->query('SELECT *, ST_AsGeoJSON(ST_Transform(geom, 4326)) As geojson FROM "' . $argv[3] . '"');
  }
  $features =[];
  foreach ($result AS $row) {
	  unset ($row['geometry']);
	  $geometry = $row['geojson'] = json_decode($row['geojson']);
	  unset ($row['geojson']);
	  $feature = ["type"=> "Feature" , "geometry" => $geometry, "properties"=> $row];
	  array_push($features, $feature);
  }
  $featureCollection = ["type" => "FeatureCollection" , "features" => $features ];
  $output = json_encode($featureCollection);
  echo $output;
?>