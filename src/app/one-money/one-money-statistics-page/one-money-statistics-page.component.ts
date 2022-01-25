import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, SubscriptionLike} from "rxjs";
import {filter, map, startWith, tap} from 'rxjs/operators';
import {TimePeriodFilterService} from '../../share/services/time-period-filter.service';
import {DataRecordService} from "../../share/services/data-record.service";
import {ApplicationNames, BarChart, Type} from "../../api/models";
import {LocalStorageService} from "../../share/services/local-storage.service";
import {CategoriesService} from "../../share/services/categories.service";
import {dayFormat, filterByType, sumAmountsByDay} from "../../../utils";
import {fullUnsubscribe} from "../../../utils/rx";

@Component({
  selector: 'app-one-money-statistics-page',
  templateUrl: './one-money-statistics-page.component.html',
  styleUrls: ['./one-money-statistics-page.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OneMoneyStatisticsPageComponent implements OnInit, OnDestroy {
  private dataSub: SubscriptionLike[] = [];
  private defaultConfig: BarChart = {
    data: [[]],
    color: '#ff00ff',
    min: 0,
    max: 10000,
    labelX: [],
    labelY: ['0', '10000']
  }

  get chartData$(): Observable<BarChart> {
    return this.data.filteredData$.pipe(filter(d => d?.length > 0), map(d => {
      const filteredOut = filterByType(d, Type.out);
      const prepared = sumAmountsByDay(filteredOut, dayFormat);
      const max = prepared.reduce((a,  item) => a = item.sum > a ? item.sum : a, 0) * 1.05;
      return {
        ...this.defaultConfig,
        data: [prepared?.map(item => item.sum)],
        labelX: prepared?.map(item => item.day),
        max,
        labelY: ['0', max.toFixed()]
      } as unknown as BarChart;
    }), startWith(this.defaultConfig));
  }

  ngOnInit(): void {
    const data = this.ls.getLocalRecord(ApplicationNames.money)?.data;
    this.data.openStatistics(ApplicationNames.money, data);

    this.dataSub.push(this.data.data$.pipe(filter(d => d?.length > 0), tap(d => {
      this.timePeriodFilter.init(d[0]?.date, d[d?.length - 1]?.date);
      this.categories.init(ApplicationNames.money);
    })).subscribe());
  }
  ngOnDestroy(): void {
    this.data.destroy();
    this.categories.destroy();
    fullUnsubscribe(this.dataSub)
  }

  constructor(private timePeriodFilter: TimePeriodFilterService, public data: DataRecordService,
              private ls: LocalStorageService, private categories: CategoriesService) { }

}
