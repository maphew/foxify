const { Readable } = require('stream');
const JSZip = require('jszip');
const ZipToXpi = require('../../libraries/ziptoxpi');

describe('ziptoxpi', () => {
  it('should convert ZIP to XPI with application ID', (done) => {
    const zip = new JSZip();
    const manifest = {
      name: 'Test Extension',
      version: '1.0',
      manifest_version: 2
    };
    
    // Add manifest to the zip
    zip.file('manifest.json', JSON.stringify(manifest));
    
    // Generate the zip file
    zip.generateAsync({ type: 'nodebuffer' }).then(buffer => {
      const zipToXpi = new ZipToXpi();
      const testAppId = 'test-extension';
      zipToXpi.setApplicationId(testAppId);
      
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      
      let xpiData = Buffer.alloc(0);
      
      readable.pipe(zipToXpi)
        .on('data', (chunk) => {
          xpiData = Buffer.concat([xpiData, chunk]);
        })
        .on('end', async () => {
          // The output should be a valid zip file
          const xpiZip = await JSZip.loadAsync(xpiData);
          
          // Check that the manifest was modified correctly
          const manifestContent = await xpiZip.file('manifest.json').async('string');
          const modifiedManifest = JSON.parse(manifestContent);
          
          expect(modifiedManifest.applications).toBeDefined();
          expect(modifiedManifest.applications.gecko).toBeDefined();
          expect(modifiedManifest.applications.gecko.id).toBe(`${testAppId}@foxify`);
          
          done();
        })
        .on('error', (err) => {
          done.fail(`Unexpected error: ${err.message}`);
        });
    });
  });

  it('should handle large files within size limit', (done) => {
    const zip = new JSZip();
    const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
    
    // Add a large file to the zip
    zip.file('large-file.txt', largeContent);
    
    // Generate the zip file
    zip.generateAsync({ type: 'nodebuffer' }).then(buffer => {
      const zipToXpi = new ZipToXpi();
      
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      
      let xpiData = Buffer.alloc(0);
      
      readable.pipe(zipToXpi)
        .on('data', (chunk) => {
          xpiData = Buffer.concat([xpiData, chunk]);
        })
        .on('end', async () => {
          // The output should be a valid zip file
          const xpiZip = await JSZip.loadAsync(xpiData);
          expect(xpiZip.files['large-file.txt']).toBeDefined();
          done();
        })
        .on('error', (err) => {
          done.fail(`Unexpected error: ${err.message}`);
        });
    });
  });
});
