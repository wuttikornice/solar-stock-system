export const numberToThaiText = (number) => {
  if (!number && number !== 0) return '-';
  const numberStr = number.toFixed(2).split('.');
  const integerPart = numberStr[0];
  const decimalPart = numberStr[1];

  const digitText = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positionText = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const convertGroup = (group) => {
    let text = "";
    for (let i = 0; i < group.length; i++) {
      let digit = parseInt(group[group.length - 1 - i]);
      if (digit !== 0) {
        if (i === 0 && digit === 1 && group.length > 1) {
          text = "เอ็ด" + text;
        } else if (i === 1 && digit === 2) {
          text = "ยี่" + positionText[i] + text;
        } else if (i === 1 && digit === 1) {
          text = positionText[i] + text;
        } else {
          text = digitText[digit] + positionText[i] + text;
        }
      }
    }
    return text;
  };

  let result = "";
  if (parseInt(integerPart) === 0) {
    result = "ศูนย์บาท";
  } else {
    let groups = [];
    let temp = integerPart;
    while (temp.length > 0) {
      groups.push(temp.substring(Math.max(0, temp.length - 6)));
      temp = temp.substring(0, Math.max(0, temp.length - 6));
    }

    for (let i = 0; i < groups.length; i++) {
      let groupText = convertGroup(groups[i]);
      if (groupText !== "") {
        result = groupText + (i > 0 ? "ล้าน" : "") + result;
      }
    }
    result += "บาท";
  }

  if (parseInt(decimalPart) === 0) {
    result += "ถ้วน";
  } else {
    result += convertGroup(decimalPart) + "สตางค์";
  }
  return result;
};
