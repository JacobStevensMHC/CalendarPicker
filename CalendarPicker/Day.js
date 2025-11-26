import React from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import PropTypes from 'prop-types';

import { differenceInDays } from 'date-fns/differenceInDays';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { isSameDay } from 'date-fns/isSameDay';
import { isWithinInterval } from 'date-fns/isWithinInterval';
import { startOfDay } from 'date-fns/startOfDay';

export default function Day(props) {
  const {
    day,
    month,
    year,
    styles,
    customDatesStyles = [],
    onPressDay,
    selectedStartDate,
    selectedEndDate,
    allowRangeSelection,
    allowBackwardRangeSelect,
    selectedDayStyle: propSelectedDayStyle,
    selectedDisabledDatesTextStyle,
    selectedRangeStartStyle,
    selectedRangeStyle,
    selectedRangeEndStyle,
    textStyle,
    todayTextStyle,
    selectedDayTextStyle: propSelectedDayTextStyle,
    selectedRangeStartTextStyle,
    selectedRangeEndTextStyle,
    minDate,
    maxDate,
    disabledDates,
    disabledDatesTextStyle,
    minRangeDuration,
    maxRangeDuration,
    enableDateChange,
    allowMultipleRanges,
    coloredRanges = {},
    scheduleStartDate,
    multipleRanges = [],
    dayOfWeek,
  } = props;

  const thisDay = new Date(year, month, day, 12);
  const today = new Date();

  let dateOutOfRange;
  let computedSelectedDayStyle = styles.dayButton; // may be overridden depending on state
  let selectedDayTextStyle = {};
  let selectedDayStyle;
  let overrideOutOfRangeTextStyle;
  let dateIsBeforeMin = false;
  let dateIsAfterMax = false;
  let dateIsDisabled = false;
  let dateRangeLessThanMin = false;
  let dateRangeGreaterThanMax = false;

  // First let's check if date is out of range
  // Check whether props maxDate / minDate are defined. If not supplied,
  // don't restrict dates.
  if (maxDate) {
    dateIsAfterMax = isAfter(startOfDay(thisDay), startOfDay(maxDate));
  }
  if (minDate) {
    dateIsBeforeMin = isBefore(startOfDay(thisDay), startOfDay(minDate));
  }

  if (disabledDates) {
    if (Array.isArray(disabledDates) && disabledDates.indexOf(thisDay.valueOf()) >= 0) {
      dateIsDisabled = true;
    }
    else if (disabledDates instanceof Function) {
      dateIsDisabled = disabledDates(thisDay);
    }
  }

  if (allowRangeSelection && selectedStartDate && !selectedEndDate) {
    let daysDiff = differenceInDays(thisDay, selectedStartDate);  // may be + or -
    daysDiff = allowBackwardRangeSelect ? Math.abs(daysDiff) : daysDiff;

    if (maxRangeDuration) {
      if (Array.isArray(maxRangeDuration)) {
        let maxRangeEntry = maxRangeDuration.find(mrd => isSameDay(selectedStartDate, mrd.date));
        if (maxRangeEntry && daysDiff > maxRangeEntry.maxDuration) {
          dateRangeGreaterThanMax = true;
        }
      } else if (daysDiff > maxRangeDuration) {
        dateRangeGreaterThanMax = true;
      }
    }

    if (minRangeDuration) {
      if (Array.isArray(minRangeDuration)) {
        let minRangeEntry = minRangeDuration.find(mrd => isSameDay(selectedStartDate, mrd.date));
        if (minRangeEntry && daysDiff < minRangeEntry.minDuration) {
          dateRangeLessThanMin = true;
        }
      } else if (daysDiff < minRangeDuration) {
        dateRangeLessThanMin = true;
      }
    }

    if (!allowBackwardRangeSelect && daysDiff < 0) {
      dateRangeLessThanMin = true;
    }
  }

  dateOutOfRange = dateIsAfterMax || dateIsBeforeMin || dateIsDisabled || dateRangeLessThanMin || dateRangeGreaterThanMax;

  let isThisDaySameAsSelectedStart = isSameDay(thisDay, selectedStartDate);
  let isThisDaySameAsSelectedEnd = isSameDay(thisDay, selectedEndDate);
  let isThisDateInSelectedRange =
    selectedStartDate
    && selectedEndDate
    && isWithinInterval(thisDay, {
      start: selectedStartDate,
      end: selectedEndDate
    })

  // If date is in range let's apply styles
  if (!dateOutOfRange || isThisDaySameAsSelectedStart || isThisDaySameAsSelectedEnd || isThisDateInSelectedRange) {
    // set today's style
    let isToday = isSameDay(thisDay, today);
    if (isToday) {
      computedSelectedDayStyle = styles.selectedToday;
      // todayTextStyle prop overrides selectedDayTextColor (created via makeStyles)
      selectedDayTextStyle = [todayTextStyle];
    }

    const custom = getCustomDateStyle({ customDatesStyles, date: thisDay });

    if (isToday && custom.style) {
      // Custom date style overrides 'today' style. It may be reset below
      // by date selection styling.
      computedSelectedDayStyle = [styles.selectedToday, custom.style];
    }

    // set selected day style
    if (!allowRangeSelection &&
      selectedStartDate &&
      isThisDaySameAsSelectedStart) {
      computedSelectedDayStyle = styles.selectedDay;
      selectedDayTextStyle = [styles.selectedDayLabel, isToday && todayTextStyle, propSelectedDayTextStyle];
      // selectedDayStyle prop overrides selectedDayColor (created via makeStyles)
      selectedDayStyle = propSelectedDayStyle || styles.selectedDayBackground;
    }

    // Set selected ranges styles
    if (allowRangeSelection) {
      if (selectedStartDate && selectedEndDate) {
        // Apply style for start date
        if (isThisDaySameAsSelectedStart) {
          computedSelectedDayStyle = [styles.startDayWrapper, selectedRangeStyle, selectedRangeStartStyle];
          selectedDayTextStyle = [styles.selectedDayLabel, propSelectedDayTextStyle, selectedRangeStartTextStyle];
        }
        // Apply style for end date
        if (isThisDaySameAsSelectedEnd) {
          computedSelectedDayStyle = [styles.endDayWrapper, selectedRangeStyle, selectedRangeEndStyle];
          selectedDayTextStyle = [styles.selectedDayLabel, propSelectedDayTextStyle, selectedRangeEndTextStyle];
        }
        // Apply style if start date is the same as end date
        if (isThisDaySameAsSelectedEnd &&
          isThisDaySameAsSelectedStart &&
          isSameDay(selectedEndDate, selectedStartDate)) {
          computedSelectedDayStyle = [styles.selectedDay, styles.selectedDayBackground, selectedRangeStyle];
          selectedDayTextStyle = [styles.selectedDayLabel, propSelectedDayTextStyle, selectedRangeStartTextStyle];
        }
        // Apply style for days inside of range, excluding start & end dates.
        if (!isThisDaySameAsSelectedEnd &&
          !isThisDaySameAsSelectedStart &&
          isWithinInterval(thisDay, { start: selectedStartDate, end: selectedEndDate })) {
          computedSelectedDayStyle = [styles.inRangeDay, selectedRangeStyle];
          selectedDayTextStyle = [styles.selectedDayLabel, propSelectedDayTextStyle];
        }
      }
      // Apply style if start date has been selected but end date has not
      if (selectedStartDate &&
        !selectedEndDate &&
        isThisDaySameAsSelectedStart) {
        computedSelectedDayStyle = [styles.startDayWrapper, selectedRangeStyle, selectedRangeStartStyle];
        selectedDayTextStyle = [styles.selectedDayLabel, propSelectedDayTextStyle, selectedRangeStartTextStyle];
        // Override out of range start day text style when minRangeDuration = 1.
        // This allows selected start date's text to be styled by selectedRangeStartTextStyle
        // even when it's below minRangeDuration.
        overrideOutOfRangeTextStyle = selectedRangeStartTextStyle;
      }
    }

    // Handle multiple colored ranges (legacy coworker implementation)
    if (allowMultipleRanges && coloredRanges && scheduleStartDate) {
      const dayNumber = getDayNumberFromDate(thisDay, scheduleStartDate);
      const rangeInfo = getColoredRangeInfo(dayNumber, coloredRanges);
      
      if (rangeInfo) {
        // Check if this is today - if so, skip range styling (will be handled by custom styles)
        let isToday = isSameDay(thisDay, today);
        
        if (isToday) {
          // Today gets a blue circle - skip range styling
          computedSelectedDayStyle = [styles.selectedDay, { backgroundColor: "#007AFF" }];
          selectedDayTextStyle = [styles.selectedDayLabel, { color: "#FFFFFF" }];
        } else {
          const { color, textColor, isStart, isEnd } = rangeInfo;
          const isSingleDay = isStart && isEnd;
          
          if (isSingleDay) {
            // Single day range - use circular style
            computedSelectedDayStyle = [styles.selectedDay, { backgroundColor: color }];
            selectedDayTextStyle = [styles.selectedDayLabel, { color: textColor }];
          } else if (isStart) {
            // Start of range - rounded left
            computedSelectedDayStyle = [{
              width: styles.startDayWrapper.width,
              height: styles.startDayWrapper.height,
              borderTopLeftRadius: styles.startDayWrapper.borderTopLeftRadius,
              borderBottomLeftRadius: styles.startDayWrapper.borderBottomLeftRadius,
              backgroundColor: color,
              alignSelf: 'center',
              justifyContent: 'center'
            }];
            selectedDayTextStyle = [styles.selectedDayLabel, { color: textColor }];
          } else if (isEnd) {
            // End of range - rounded right
            computedSelectedDayStyle = [{
              width: styles.endDayWrapper.width,
              height: styles.endDayWrapper.height,
              borderTopRightRadius: styles.endDayWrapper.borderTopRightRadius,
              borderBottomRightRadius: styles.endDayWrapper.borderBottomRightRadius,
              backgroundColor: color,
              alignSelf: 'center',
              justifyContent: 'center'
            }];
            selectedDayTextStyle = [styles.selectedDayLabel, { color: textColor }];
          } else {
            // Middle of range - no rounded corners
            computedSelectedDayStyle = [{
              width: styles.inRangeDay.width,
              height: styles.inRangeDay.height,
              backgroundColor: color,
              alignSelf: 'center',
              justifyContent: 'center'
            }];
            selectedDayTextStyle = [styles.selectedDayLabel, { color: textColor }];
          }
        }
      }
    }

    // Handle multipleRanges prop (new implementation with direct day-of-month mapping)
    if (multipleRanges && multipleRanges.length > 0 && dayOfWeek !== undefined) {
      const rangeInfo = getMultipleRangeInfo(day, multipleRanges);
      
      if (rangeInfo) {
        const { style, isRangeStart, isRangeEnd, isSingleDay } = rangeInfo;
        const backgroundColor = style?.backgroundColor || '#5ce600';
        const textColor = style?.color || style?.textColor || '#FFFFFF';
        
        // Determine edge rounding based on range position and week position
        const isFirstOfWeek = dayOfWeek === 0;
        const isLastOfWeek = dayOfWeek === 6;
        
        // Round left if: start of range OR first day of week (within a range)
        const roundLeft = isRangeStart || isFirstOfWeek;
        // Round right if: end of range OR last day of week (within a range)
        const roundRight = isRangeEnd || isLastOfWeek;
        
        const baseRadius = styles.startDayWrapper.borderTopLeftRadius || 20;
        
        if (isSingleDay) {
          // Single day range - full circle
          computedSelectedDayStyle = [styles.selectedDay, { backgroundColor }];
          selectedDayTextStyle = [styles.selectedDayLabel, { color: textColor }];
        } else {
          // Build style based on which edges should be rounded
          const rangeStyle = {
            width: styles.inRangeDay.width,
            height: styles.inRangeDay.height,
            backgroundColor,
            alignSelf: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: roundLeft ? baseRadius : 0,
            borderBottomLeftRadius: roundLeft ? baseRadius : 0,
            borderTopRightRadius: roundRight ? baseRadius : 0,
            borderBottomRightRadius: roundRight ? baseRadius : 0,
          };
          
          computedSelectedDayStyle = [rangeStyle];
          selectedDayTextStyle = [styles.selectedDayLabel, { color: textColor }];
        }
      }
    }

    if (dateOutOfRange) { // start or end date selected, and this date outside of range.
      return (
        <View style={[styles.dayWrapper, custom.containerStyle]}>
          <View style={[custom.style, computedSelectedDayStyle, selectedDayStyle]}>
            <Text style={[styles.dayLabel, textStyle,
            styles.disabledText, disabledDatesTextStyle,
            styles.selectedDisabledText, selectedDisabledDatesTextStyle,
              overrideOutOfRangeTextStyle
            ]}>
              {day}
            </Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={[styles.dayWrapper, custom.containerStyle]}>
          <TouchableOpacity
            disabled={!enableDateChange}
            style={[custom.style, computedSelectedDayStyle, selectedDayStyle]}
            onPress={() => onPressDay({ year, month, day })}>
            <Text style={[styles.dayLabel, textStyle, custom.textStyle, selectedDayTextStyle]}>
              {day}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  }
  else {  // dateOutOfRange = true, and no selected start or end date.
    const custom = getCustomDateStyle({ customDatesStyles, date: thisDay });
    // Allow customDatesStyles to override disabled dates if allowDisabled set
    if (!custom.allowDisabled) {
      custom.containerStyle = null;
      custom.style = null;
      custom.textStyle = null;
    }
    return (
      <View style={[styles.dayWrapper, custom.containerStyle]}>
        <View style={[styles.dayButton, custom.style]}>
          <Text style={[textStyle, styles.disabledText, disabledDatesTextStyle, custom.textStyle]}>
            {day}
          </Text>
        </View>
      </View>
    );
  }
}

function getCustomDateStyle({ customDatesStyles, date }) {
  if (Array.isArray(customDatesStyles)) {
    for (let cds of customDatesStyles) {
      if (isSameDay(date, new Date(cds.date))) {
        return { ...cds };
      }
    }
  }
  else if (customDatesStyles instanceof Function) {
    let cds = customDatesStyles(date) || {};
    return { ...cds };
  }
  return {};
}

// Helper function to get day number from schedule start date
function getDayNumberFromDate(date, scheduleStartDate) {
  if (!scheduleStartDate) return null;
  const startDate = new Date(scheduleStartDate);
  startDate.setHours(0, 0, 0, 0);
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  const diffTime = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Day numbers are 1-indexed
}

// Legacy helper for coloredRanges prop (uses scheduleStartDate-relative day numbers)
function getColoredRangeInfo(dayNumber, coloredRanges) {
  if (!dayNumber || !coloredRanges) return null;
  
  for (const [color, rangeConfig] of Object.entries(coloredRanges)) {
    const ranges = rangeConfig.ranges || rangeConfig;
    if (!Array.isArray(ranges)) continue;
    
    for (const range of ranges) {
      if (!Array.isArray(range) || range.length === 0) continue;
      
      const sortedRange = [...range].sort((a, b) => a - b);
      const rangeStart = sortedRange[0];
      const rangeEnd = sortedRange[sortedRange.length - 1];
      
      if (sortedRange.includes(dayNumber)) {
        const textColor = rangeConfig.textColor || '#FFFFFF';
        return {
          color,
          textColor,
          isStart: dayNumber === rangeStart,
          isEnd: dayNumber === rangeEnd,
          isInRange: true,
          range: sortedRange
        };
      }
    }
  }
  return null;
}

// Helper function to check if a day-of-month is in a multipleRanges range
// multipleRanges format: [{ range: [1, 2, 3], style: { backgroundColor: '#FF0000' } }, ...]
function getMultipleRangeInfo(dayOfMonth, multipleRanges) {
  if (!dayOfMonth || !multipleRanges || !Array.isArray(multipleRanges)) return null;
  
  for (const rangeConfig of multipleRanges) {
    if (!rangeConfig || !Array.isArray(rangeConfig.range) || rangeConfig.range.length === 0) continue;
    
    // Filter to valid day numbers (1-31) and sort
    const validDays = rangeConfig.range
      .filter(d => typeof d === 'number' && d >= 1 && d <= 31)
      .sort((a, b) => a - b);
    
    if (validDays.length === 0) continue;
    
    if (validDays.includes(dayOfMonth)) {
      const rangeStart = validDays[0];
      const rangeEnd = validDays[validDays.length - 1];
      const isSingleDay = validDays.length === 1;
      
      return {
        style: rangeConfig.style || {},
        isRangeStart: dayOfMonth === rangeStart,
        isRangeEnd: dayOfMonth === rangeEnd,
        isSingleDay,
        range: validDays
      };
    }
  }
  return null;
}

Day.propTypes = {
  styles: PropTypes.shape({}),
  day: PropTypes.number,
  onPressDay: PropTypes.func,
  disabledDates: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
  minRangeDuration: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
  maxRangeDuration: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
  allowMultipleRanges: PropTypes.bool,
  coloredRanges: PropTypes.object,
  scheduleStartDate: PropTypes.any,
  multipleRanges: PropTypes.arrayOf(PropTypes.shape({
    range: PropTypes.arrayOf(PropTypes.number).isRequired,
    style: PropTypes.object,
  })),
  dayOfWeek: PropTypes.number,
};
