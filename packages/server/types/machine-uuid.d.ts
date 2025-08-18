declare module 'machine-uuid' {
  /**
   * Get the machine's unique identifier (UUID)
   * @returns Promise that resolves to the machine UUID as a string
   */
  function machineUuid(): Promise<string>;
  
  export = machineUuid;
}
