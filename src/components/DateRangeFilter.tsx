import React, { useState, useEffect } from 'react';
import { Select, DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface DateRangeFilterProps {
    onChange: (dates: { startDate: string | null; endDate: string | null }) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onChange }) => {
    const [filterType, setFilterType] = useState<string>('today');
    const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

    useEffect(() => {
        handleFilterChange('today');
    }, []);

    const handleFilterChange = (value: string) => {
        setFilterType(value);

        let start: Dayjs | null = null;
        let end: Dayjs | null = null;
        const today = dayjs();

        switch (value) {
            case 'today':
                start = today.startOf('day');
                end = today.endOf('day');
                break;
            case 'yesterday':
                start = today.subtract(1, 'day').startOf('day');
                end = today.subtract(1, 'day').endOf('day');
                break;
            case 'last7days':
                start = today.subtract(6, 'day').startOf('day');
                end = today.endOf('day');
                break;
            case 'last30days':
                start = today.subtract(29, 'day').startOf('day');
                end = today.endOf('day');
                break;
            case 'thisMonth':
                start = today.startOf('month');
                end = today.endOf('month');
                break;
            case 'custom':
                // Reset or keep previous custom range
                start = customRange ? customRange[0] : null;
                end = customRange ? customRange[1] : null;
                break;
            default:
                break;
        }

        if (value !== 'custom' && start && end) {
            setCustomRange(null); // Clear custom range visual if specific preset selected
            onChange({
                startDate: start.toISOString(),
                endDate: end.toISOString()
            });
        }
    };

    const handleRangeChange = (dates: any) => {
        setCustomRange(dates);
        if (dates && dates[0] && dates[1]) {
            onChange({
                startDate: dates[0].toISOString(),
                endDate: dates[1].toISOString()
            });
        }
    };

    return (
        <Space wrap>
            <Select
                value={filterType}
                onChange={handleFilterChange}
                style={{ width: 160 }}
                className="rounded-lg"
            >
                <Option value="today">Today</Option>
                <Option value="yesterday">Yesterday</Option>
                <Option value="last7days">Last 7 Days</Option>
                <Option value="thisMonth">This Month</Option>
                <Option value="custom">Custom Range</Option>
            </Select>

            {filterType === 'custom' && (
                <RangePicker
                    value={customRange}
                    onChange={handleRangeChange}
                    className="rounded-lg bg-white"
                    allowClear={false}
                />
            )}
        </Space>
    );
};
