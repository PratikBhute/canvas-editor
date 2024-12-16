import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppDrawComponent } from "./draw/draw.component";
import { MatIconModule } from '@angular/material/icon';
// import AccountBoxIcon from '@mui/icons-material/AccountBox';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppDrawComponent, MatIconModule,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'canvas-editor';
}
