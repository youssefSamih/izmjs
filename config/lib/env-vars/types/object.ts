import GenericField from './generic';
/**
 * Object field
 */
class ObjectField extends GenericField {
  setValue(value: string) {
    let json = {};

    if (typeof value === 'string') {
      try {
        json = JSON.parse(value);
      } catch (e) {
        json = {};
      }
    }

    this.value = json;

    return this;
  }

  toString() {
    if (typeof this.value === 'undefined' || this.value === null) {
      return undefined;
    }

    return JSON.stringify(this.value);
  }
}

export default ObjectField;
