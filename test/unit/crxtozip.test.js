const { Readable } = require('stream');
const CrxToZip = require('../../libraries/crxtozip');

describe('crxtozip', () => {
  it('should throw error for invalid CRX file', (done) => {
    const crx = new CrxToZip();
    const invalidCrx = Buffer.from('INVALID_CRX_HEADER');
    
    const readable = new Readable();
    readable.push(invalidCrx);
    readable.push(null);
    
    readable.pipe(crx)
      .on('error', (err) => {
        expect(err).toBeDefined();
        expect(err.message).toContain('Invalid or corrupted CRX extension');
        done();
      })
      .on('data', () => {
        // Should not reach here for invalid CRX
        done.fail('Should not process invalid CRX file');
      });
  });

  // Note: This is a simplified test. A real test would need a valid CRX header
  it('should process valid CRX file', (done) => {
    const crx = new CrxToZip();
    
    // Create a minimal valid CRX header (simplified for testing)
    const header = Buffer.alloc(16);
    header.write('Cr24'); // Magic number
    header.writeUInt32LE(2, 4); // Version 2
    header.writeUInt32LE(0, 8); // Public key length (0 for test)
    header.writeUInt32LE(0, 12); // Signature length (0 for test)
    
    const readable = new Readable();
    readable.push(header);
    readable.push(null);
    
    let dataReceived = false;
    
    readable.pipe(crx)
      .on('data', (chunk) => {
        dataReceived = true;
      })
      .on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      })
      .on('error', (err) => {
        done.fail(`Unexpected error: ${err.message}`);
      });
  });
});
