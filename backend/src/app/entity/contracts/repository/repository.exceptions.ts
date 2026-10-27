/** Domain-level repository error shared by services and repository adapters. */
export class RecordNotFoundException extends Error {
  constructor(message = 'Record not found') {
    super(message);
    this.name = 'RecordNotFoundException';
  }
}
