import fp2 from "fingerprintjs2";
export default (config) => {
  return new Promise(resolve => {
    fp2.get(config, (components) => {
		 	const values = components.map((component) => { return component.value });
		  const marmur = fp2.x64hash128(values.join(''), 31);
      resolve({ hash: marmur || null, components: components || { } });
    });
  })
};
//const promiseToFingerprint = () => new Promise(resolve => { fp2.get({}, (components) => { resolve(components); })});	

/*
	fp2.get({ }, (components) => { 
    const values = components.map((component) => { return component.value });
    this.fingerprintHash = fp2.x64hash128(values.join(''), 31); // murmur
		this.fingerprintData = components;
	
		global.log("store:: fingerprint:: ", this.fingerprintHash, this.fingerprintData,);

	});
*/