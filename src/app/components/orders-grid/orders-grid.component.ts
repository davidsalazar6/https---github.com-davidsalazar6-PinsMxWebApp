import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OrderService } from '../services/order.service';
import { Order } from 'src/app/models/order';
import { StatusService } from '../services/status.service';
import { Status } from 'src/app/models/status';
import { OrderFormComponent } from '../order-form/order-form.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
@Component({
  selector: 'app-orders-grid',
  templateUrl: './orders-grid.component.html',
  styleUrls: ['./orders-grid.component.css'],
})
export class OrdersGridComponent implements OnInit {
  @Output() updateMetrics = new EventEmitter<void>();
  orders: Order[] = [];
  ordersCopy: Order[] = [];
  columnsNames: string[] = [
    'Cliente',
    'Producto',
    'Fecha creación',
    'Status',
    'Cantidad',
    'Precio unitario',
    'Anticipo',
    'Pago total',
    'Subtotal',
    'Factura #.',
    'Capturado por',
  ];
  public dropdownOpen = false;
  orderStatuses = [];
  selectedStatus: string = 'Todos';
  loggedUser: any;

  constructor(
    public date: DatePipe,
    public dialog: MatDialog,
    private orderService: OrderService,
    private statusService: StatusService
  ) {
    this.loggedUser = this.getUser();
  }
  ngOnInit(): void {
    this.selectOrders();
    this.selectStatus();
  }
  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  selectOrders() {
    this.orderService.selectOrders().subscribe((data: Order[]) => {
      this.orders = data;
      console.log(this.orders)
      this.ordersCopy = structuredClone(this.orders);
    });
  }
  selectStatus() {
    this.statusService.getStatus().subscribe((data: Status[]) => {
      this.orderStatuses = [{ key: 'Todos', name: 'Todos' }, ...data];
    });
  }
  onclickExport() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.orders);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Ordenes al dia.xlsx');
  }
  calculateOverdue(order: Order) {
    const today = new Date().getTime();
    const createdDate = new Date(order.createdDateTime).getTime();
    const diffInMs = today - createdDate;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays >= 7) {
      order.isOverdue = true;
    }
  }
  onclickStatus(status: any) {
    if (status.key === 'Todos') {
      return (this.orders = this.ordersCopy);
    } else {
      this.orders = this.ordersCopy.filter((x) => x.statusKey === status.key);
    }

    return this.orders;
  }
  openDialog(action: string, order: Order) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      order: order,
      action: action,
      loggedUser: this.loggedUser
    };

    this.dialog.open(OrderFormComponent, dialogConfig).afterClosed().subscribe((res) => {
      if(res === 'Success') {
        this.selectOrders();
        this.updateMetrics.emit();
      }
     });
  }
}
